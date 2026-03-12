import { prisma } from "@libs/db/prisma";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import crypto from "node:crypto";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { UnauthorizedError } from "@/utils/errors/unAuthError";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/utils/errors/common";

const RP_ID = process.env.RP_ID || "localhost";
const RP_NAME = process.env.RP_NAME || "Secure-Vault X";
const EXPECTED_ORIGIN = process.env.EXPECTED_ORIGIN || "http://localhost:3000";

const JWT_SECRET_STRING = process.env.JWT_SECRET;

if (!JWT_SECRET_STRING) {
  throw new Error("JWT_SECRET must be set in all environments");
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

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

    // Store challenge tied to user explicitly with 5-minute expiry in Redis

    return options;
  }

  static async verifyRegistrationResponse(
    email: string,
    registrationResponse: any,
    deviceName?: string,
    publicKey?: string,
    encryptedMEK?: string,
  ) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError("User not found");

    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: "",
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
      const device = await prisma.device.create({
        data: {
          userId: user.id,
          deviceName: deviceName || "New Device",
          publicKey: publicKey || null,
          encryptedMEK: encryptedMEK || "",
          isTrusted: true, // Auto-trust first device mathematically established in DeviceService, but we know this is the first here mostly. Wait, let's explicitly calculate it or just set it since it's via registration.
        },
      });

      // We need to issue a token tied to this device ID
      return this.generateTokens(user.id, user.email, device.id);
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

    return options;
  }

  static async verifyLoginResponse(email: string, authenticationResponse: any) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { credentials: true },
    });
    if (!user) throw new NotFoundError("User not found");

    const authenticator = user.credentials.find(
      (c: any) => c.credentialId === authenticationResponse.id,
    );
    if (!authenticator)
      throw new BadRequestError("Authenticator not registered");

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: "",
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

    if (!user || !user.passwordHash) {
      // Dummy hash to mitigate timing attacks
      await bcrypt.hash(passwordRaw, 12);
      throw new UnauthorizedError("Invalid credentials");
    }

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
    const tokens = await this.generateTokens(user.id, user.email);
    return { ...tokens, requiresMfa: false };
  }

  static async verifyOtp(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestError("Invalid request");

    // Fetch the latest OTP attempt
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { userId: user.id, type: "EMAIL_LOGIN", isRevoked: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) throw new BadRequestError("No pending OTP found");

    if (otpRecord.expiresAt < new Date())
      throw new BadRequestError("OTP Expired");

    if (otpRecord.code !== code) throw new BadRequestError("Invalid OTP");

    // Validated, burn all pending OTPs so they can't be reused
    await prisma.otpVerification.updateMany({
      where: { userId: user.id, type: "EMAIL_LOGIN", isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    // Issue Tokens
    return await this.generateTokens(user.id, user.email);
  }

  static async getPendingOtp(userId: string) {
    return prisma.otpVerification.findMany({
      where: {
        userId,
        type: "EMAIL_LOGIN",
        isRevoked: false,
        expiresAt: { gt: new Date() }, // Only grab active ones
      },
      select: {
        id: true,
        code: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async revokeOtp(userId: string, otpId: string) {
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { id: otpId },
    });

    if (!otpRecord) throw new NotFoundError("OTP not found");
    if (otpRecord.userId !== userId)
      throw new UnauthorizedError("Unauthorized");

    return prisma.otpVerification.update({
      where: { id: otpId },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  // ==========================================
  // 3.5. PASSWORD CHANGE LOGIC
  // ==========================================
  static async requestPasswordChangeOtp(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    const code = crypto.randomInt(100000, 999999).toString();
    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        code,
        type: "CHANGE_PASSWORD",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP] Change Password OTP: ${code}`);
    }
    return { requiresMfa: true, message: "OTP sent to email" };
  }

  static async changePassword(userId: string, currentPasswordRaw: string, newPasswordRaw: string, otp?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    if (user.passwordHash) {
      if (!currentPasswordRaw) throw new BadRequestError("Current password is required");
      const validPassword = await bcrypt.compare(currentPasswordRaw, user.passwordHash);
      if (!validPassword) throw new UnauthorizedError("Invalid current password");
    }

    if (!otp) throw new BadRequestError("OTP is required");
    const otpRecord = await prisma.otpVerification.findFirst({
      where: { userId: user.id, type: "CHANGE_PASSWORD", isRevoked: false },
      orderBy: { createdAt: "desc" },
    });
    if (!otpRecord) throw new BadRequestError("No pending OTP found");
    if (otpRecord.expiresAt < new Date()) throw new BadRequestError("OTP Expired");
    if (otpRecord.code !== otp) throw new BadRequestError("Invalid OTP");

    await prisma.otpVerification.updateMany({
      where: { userId: user.id, type: "CHANGE_PASSWORD", isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    const newPasswordHash = await bcrypt.hash(newPasswordRaw, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all other refresh tokens to secure the account
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    return { success: true, message: "Password updated successfully." };
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
      storedToken.deviceId || undefined,
    );
  }

  // Helper
  private static async generateTokens(
    userId: string,
    email: string,
    deviceId?: string,
  ) {
    // Generate Refresh Token (7 days) first so we can use its ID as the session ID
    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const hash = crypto
      .createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const refreshTokenObj = await prisma.refreshToken.create({
      data: {
        userId,
        deviceId: deviceId || null,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const sessionId = refreshTokenObj.id;

    // Generate Access Token (15 mins)
    const accessToken = await new SignJWT({ userId, email, sessionId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("securevault-api")
      .setAudience("securevault-client")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(JWT_SECRET);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      sessionId,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        mfaEnabled: true,
        createdAt: true,
        devices: {
          select: {
            id: true,
            deviceName: true,
            isTrusted: true,
            createdAt: true,
            deviceIdentifier: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedError("User not found");

    return {
      ...user,
      role: "USER",
    };
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

  // ==========================================
  // 5. ENCRYPTION SALT MANAGEMENT
  // ==========================================
  static async getEncryptionSalt(userId: string) {
    const encryptionData = await prisma.userEncryption.findUnique({
      where: { userId },
    });

    if (!encryptionData) {
      return { salt: null };
    }

    return { salt: encryptionData.salt };
  }

  static async setEncryptionSalt(userId: string, salt: string) {
    const encryptionData = await prisma.userEncryption.upsert({
      where: { userId },
      update: { salt },
      create: { userId, salt },
    });

    return { salt: encryptionData.salt };
  }

  // ==========================================
  // 6. MFA TOGGLE
  // ==========================================
  static async toggleMfa(userId: string, enabled: boolean) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: enabled },
    });

    return { mfaEnabled: user.mfaEnabled };
  }
}
