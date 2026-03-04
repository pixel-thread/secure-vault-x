import { Context } from "hono";
import { prisma } from "@securevault/database";
import { AuthService } from "../services/auth.service";
import { successResponse } from "../utils/helper/response";
import { UnauthorizedError } from "../utils/errors/unauthorize";

export class AuthController {
  // Registration Flow
  static async registerGenerateOptions(c: Context) {
    const { email } = await c.req.json();
    if (!email || typeof email !== "string")
      return successResponse(c, {
        success: false,
        message: "Invalid email",
        status: 400,
      });

    const options = await AuthService.generateRegistrationOptions(email);
    return successResponse(c, { data: options });
  }

  static async registerVerify(c: Context) {
    const { email, registrationResponse, deviceName, encryptedMEK } =
      await c.req.json();
    const result = await AuthService.verifyRegistrationResponse(
      email,
      registrationResponse,
      deviceName,
      encryptedMEK,
    );
    return successResponse(c, { data: result });
  }

  // Login Flow
  static async loginGenerateOptions(c: Context) {
    const { email } = await c.req.json();
    const options = await AuthService.generateLoginOptions(email);
    return successResponse(c, { data: options });
  }

  static async loginVerify(c: Context) {
    const { email, authenticationResponse } = await c.req.json();
    const tokens = (await AuthService.verifyLoginResponse(
      email,
      authenticationResponse,
    )) as any;
    return successResponse(c, { data: tokens });
  }

  // ==========================
  // Email/Password + OTP Flow
  // ==========================
  static async registerPassword(c: Context) {
    const { email, password } = await c.req.json();
    const result = await AuthService.registerPassword(email, password);
    return successResponse(c, {
      data: result,
      message: "Registration successfully, please login to continue.",
    });
  }

  static async loginPassword(c: Context) {
    const { email, password } = await c.req.json();
    const result = (await AuthService.loginPassword(email, password)) as any;
    return successResponse(c, {
      data: result,
      message: result.message || "Login successful",
    });
  }

  static async verifyOtp(c: Context) {
    const { email, code } = await c.req.json();
    const tokens = (await AuthService.verifyOtp(email, code)) as any;
    return successResponse(c, {
      data: tokens,
    });
  }

  static async getPendingOtp(c: Context) {
    const userId = c.get("userId");

    // Ensure the device making the request is trusted
    const sessionId = c.get("sessionId");

    if (!sessionId) {
      throw new UnauthorizedError("Session ID missing");
    }

    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
      include: { device: true },
    });

    if (!session?.device?.isTrusted) {
      // If the device is not trusted, return an empty array for now
      // BUG: it throw random 401 error
      // throw new UnauthorizedError("Device is not trusted");
      return successResponse(c, { data: [] });
    }

    const otps = await AuthService.getPendingOtp(userId);
    return successResponse(c, { data: otps });
  }

  static async revokeOtp(c: Context) {
    const userId = c.get("userId");
    const { otpId } = await c.req.json();
    const result = await AuthService.revokeOtp(userId, otpId);
    return successResponse(c, {
      data: result,
      message: "OTP successfully revoked",
    });
  }

  // ==========================
  // Refresh Token
  // ==========================
  static async refreshTokens(c: Context) {
    const { refreshToken } = await c.req.json();
    if (!refreshToken) throw new UnauthorizedError("Unauthorized");

    const tokens = (await AuthService.refreshTokens(refreshToken)) as any;
    return successResponse(c, {
      data: tokens,
    });
  }

  static async getMe(c: Context) {
    const userId = c.get("userId");
    const user = await AuthService.getMe(userId);
    return successResponse(c, { data: user });
  }

  static async logout(c: Context) {
    const { refreshToken } = await c.req.json();
    await AuthService.logout(refreshToken);
    return successResponse(c, { message: "Logout successful" });
  }

  // ==========================
  // Encryption Salt
  // ==========================
  static async getEncryptionSalt(c: Context) {
    const userId = c.get("userId");
    const encryptionData = await AuthService.getEncryptionSalt(userId);
    return successResponse(c, { data: encryptionData });
  }

  static async setEncryptionSalt(c: Context) {
    const userId = c.get("userId");
    const { salt } = await c.req.json();
    const encryptionData = await AuthService.setEncryptionSalt(userId, salt);
    return successResponse(c, { data: encryptionData });
  }

  // ==========================
  // MFA Toggle
  // ==========================
  static async toggleMfa(c: Context) {
    const userId = c.get("userId");
    const { enabled } = await c.req.json();
    const result = await AuthService.toggleMfa(userId, enabled);
    return successResponse(c, {
      data: result,
      message: enabled
        ? "Two-factor authentication enabled"
        : "Two-factor authentication disabled",
    });
  }
}
