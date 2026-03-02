import { Context } from "hono";
import { AuthService } from "../services/auth.service";
import { sendResponse } from "../utils/helper/response";
import { UnauthorizedError } from "../utils/errors/unauthorize";

export class AuthController {
  // Registration Flow
  static async registerGenerateOptions(c: Context) {
    const { email } = await c.req.json();
    if (!email || typeof email !== "string")
      return sendResponse(c, {
        success: false,
        message: "Invalid email",
        status: 400,
      });

    const options = await AuthService.generateRegistrationOptions(email);
    return sendResponse(c, { data: options });
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
    return sendResponse(c, { data: result });
  }

  // Login Flow
  static async loginGenerateOptions(c: Context) {
    const { email } = await c.req.json();
    const options = await AuthService.generateLoginOptions(email);
    return sendResponse(c, { data: options });
  }

  static async loginVerify(c: Context) {
    const { email, authenticationResponse } = await c.req.json();
    const tokens = (await AuthService.verifyLoginResponse(
      email,
      authenticationResponse,
    )) as any;
    return sendResponse(c, { data: tokens });
  }

  // ==========================
  // Email/Password + OTP Flow
  // ==========================
  static async registerPassword(c: Context) {
    const { email, password } = await c.req.json();
    const result = await AuthService.registerPassword(email, password);
    return sendResponse(c, {
      data: result,
      message: "Registration successful",
    });
  }

  static async loginPassword(c: Context) {
    const { email, password } = await c.req.json();

    const result = (await AuthService.loginPassword(email, password)) as any;
    return sendResponse(c, {
      data: result,
      message: "Login successful",
    });
  }

  static async verifyOtp(c: Context) {
    const { email, code } = await c.req.json();
    const tokens = (await AuthService.verifyOtp(email, code)) as any;
    return sendResponse(c, {
      data: tokens,
    });
  }

  // ==========================
  // Refresh Token
  // ==========================
  static async refreshTokens(c: Context) {
    const { refreshToken } = await c.req.json();

    if (!refreshToken) throw new UnauthorizedError("Unauthorized");

    const tokens = (await AuthService.refreshTokens(refreshToken)) as any;
    return sendResponse(c, {
      data: tokens,
    });
  }

  static async getMe(c: Context) {
    const userId = c.get("userId");
    const user = await AuthService.getMe(userId);
    return sendResponse(c, { data: user });
  }
}
