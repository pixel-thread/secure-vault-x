import { prisma } from "@securevault/database";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import crypto from "node:crypto";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { UnauthorizedError } from "../utils/errors/unauthorize";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../utils/errors/common";

const RP_ID = process.env.RP_ID || "localhost";
const RP_NAME = process.env.RP_NAME || "Secure-Vault X";
const EXPECTED_ORIGIN = process.env.EXPECTED_ORIGIN || "http://localhost:3000";
const JWT_SECRET_STRING = process.env.JWT_SECRET;
if (!JWT_SECRET_STRING && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}
const JWT_SECRET = new TextEncoder().encode(
  JWT_SECRET_STRING || "dev-only-secret-key-12345",
);

// In-Memory store for WebAuthn Challenge states (in production, use Redis)
export const challengeStore = new Map<
  string,
  { challenge: string; expiresAt: number }
>();

export class AuthService {
  // ==========================================
  // 1. REGISTRATION LOGIC
  // ==========================================
  static async generateRegistrationOptions(email: string) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) user = await prisma.user.create({ data: { email } });

    const existingCredentials = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
    });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new Uint8Array(Buffer.from(user.id)),
      userName: user.email,
      attestationType: "none",
      excludeCredentials: existingCredentials.map((cred: any) => ({
        id: cred.credentialId, // using base64url string ID
        type: "public-key",
      })),
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "preferred",
      },
    });

    // Store challenge tied to user explicitly with 5-minute expiry
    challengeStore.set(user.id, {
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return options;
  }

  static async verifyRegistrationResponse(
    email: string,
    registrationResponse: any,
    deviceName?: string,
    encryptedMEK?: string,
  ) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("User not found");

    const expectedChallengeObj = challengeStore.get(user.id);
    if (!expectedChallengeObj) throw new BadRequestError("Challenge expired");
    if (Date.now() > expectedChallengeObj.expiresAt) {
      challengeStore.delete(user.id);
      throw new BadRequestError("Challenge expired");
    }

    const expectedChallenge = expectedChallengeObj.challenge;

    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });

    if (verification.verified && verification.registrationInfo) {
      const {
        publicKey,
        id: credentialID,
        counter,
      } = verification.registrationInfo.credential as any;

      // Ensure credential mapping
      await prisma.webAuthnCredential.create({
        data: {
          userId: user.id,
          credentialId: credentialID,
          publicKey: Buffer.from(publicKey),
          counter: BigInt(counter),
          transports: JSON.stringify(
            registrationResponse.response.transports || [],
          ),
        },
      });

      // Register Initial device & MEK payload
      await prisma.device.create({
        data: {
          userId: user.id,
          deviceName: deviceName || "New Device",
          encryptedMEK: encryptedMEK || "pending_sync",
        },
      });

      challengeStore.delete(user.id);

      return { status: "success" };
    }
    throw new BadRequestError("Verification failed");
  }

  // ==========================================
  // 2. LOGIN LOGIC
  // ==========================================
  static async generateLoginOptions(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { credentials: true },
    });

    if (!user || user.credentials.length === 0) {
      throw new BadRequestError("User not registered");
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: user.credentials.map((c: any) => ({
        id: c.credentialId,
        type: "public-key",
        transports: JSON.parse(c.transports),
      })),
      userVerification: "preferred",
    });

    challengeStore.set(user.id, {
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return options;
  }

  static async verifyLoginResponse(email: string, authenticationResponse: any) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { credentials: true },
    });
    if (!user) throw new NotFoundError("User not found");

    const expectedChallengeObj = challengeStore.get(user.id);
    if (!expectedChallengeObj) throw new BadRequestError("Challenge expired");
    if (Date.now() > expectedChallengeObj.expiresAt) {
      challengeStore.delete(user.id);
      throw new BadRequestError("Challenge expired");
    }

    const expectedChallenge = expectedChallengeObj.challenge;

    const authenticator = user.credentials.find(
      (c: any) => c.credentialId === authenticationResponse.id,
    );
    if (!authenticator)
      throw new BadRequestError("Authenticator not registered");

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge,
      expectedOrigin: EXPECTED_ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: authenticator.credentialId,
        publicKey: new Uint8Array(authenticator.publicKey),
        counter: Number(authenticator.counter),
        transports: JSON.parse(authenticator.transports),
      },
    } as any);

    if (verification.verified) {
      await prisma.webAuthnCredential.update({
        where: { id: authenticator.id },
        data: { counter: BigInt(verification.authenticationInfo.newCounter) },
      });
      challengeStore.delete(user.id);

      // Issue Tokens
      return await this.generateTokens(user.id, user.email);
    }
    throw new BadRequestError("Verification signature failed");
  }

  // ==========================================
  // 3. EMAIL/PASSWORD + OTP MFA LOGIC
  // ==========================================

  static async registerPassword(email: string, passwordRaw: string) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (user && user.passwordHash)
      throw new ConflictError("User already exist");

    const passwordHash = await bcrypt.hash(passwordRaw, 12);

    if (!user) {
      user = await prisma.user.create({
        data: { email, passwordHash },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
    }

    return {
      email: user.email,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
    };
  }

  static async loginPassword(email: string, passwordRaw: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash)
      throw new UnauthorizedError("Invalid credentials");

    const validPassword = await bcrypt.compare(passwordRaw, user.passwordHash);

    if (!validPassword) throw new UnauthorizedError("Invalid credentials");

    if (user.mfaEnabled) {
      // Generate 6-digit OTP
      const code = crypto.randomInt(100000, 999999).toString();

      // Store OTP with 10-minute expiry
      await prisma.otpVerification.create({
        data: {
          userId: user.id,
          code,
          type: "EMAIL_LOGIN",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      // In a real app, send `code` via email here.
      // For demonstration, we will return it in development environments or logs.
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV OTP] Your code is: ${code}`);
      }

      return { requiresMfa: true, message: "OTP sent to email" };
    }

    // Direct Login without MFA (fallback)
    return await this.generateTokens(user.id, user.email);
  }

  static async verifyOtp(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestError("Invalid request");

    // Fetch the latest OTP attempt
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { userId: user.id, type: "EMAIL_LOGIN" },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) throw new BadRequestError("No pending OTP found");

    if (otpRecord.expiresAt < new Date())
      throw new BadRequestError("OTP Expired");

    if (otpRecord.code !== code) throw new BadRequestError("Invalid OTP");

    // Validated, burn the OTP so it can't be reused
    await prisma.otpVerification.deleteMany({
      where: { userId: user.id, type: "EMAIL_LOGIN" },
    });

    // Issue Tokens
    return await this.generateTokens(user.id, user.email);
  }

  // ==========================================
  // 4. REFRESH TOKEN ROTATION
  // ==========================================
  static async refreshTokens(refreshToken: string) {
    const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: { user: true },
    });

    if (!storedToken) throw new UnauthorizedError("Invalid refresh token");

    if (storedToken.revoked) {
      // Honeypot reuse detection: Revoke ALL tokens for this user
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revoked: true },
      });
      throw new UnauthorizedError(
        "Token reuse detected. All sessions revoked.",
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError("Token expired");
    }

    // Revoke the old token (Rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Issue new tokens
    return await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
    );
  }

  // Helper
  private static async generateTokens(userId: string, email: string) {
    // Generate Access Token (15 mins)
    const accessToken = await new SignJWT({ userId, email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("securevault-api")
      .setAudience("securevault-client")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(JWT_SECRET);

    // Generate Refresh Token (7 days)
    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const hash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        devices: true,
      },
    });

    if (!user) throw new NotFoundError("User not found");

    return user;
  }

  static async logout(token: string) {
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hash, revoked: false },
    });

    if (!storedToken) throw new UnauthorizedError("UnAuthorized");

    return await prisma.refreshToken.update({
      where: { tokenHash: hash },
      data: { revoked: true },
    });
  }
}
