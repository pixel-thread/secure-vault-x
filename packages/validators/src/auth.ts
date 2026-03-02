import { z } from "zod";

// ==========================================
// AUTHENTICATION SCHEMAS
// ==========================================

export const generateRegistrationOptionsSchema = z.object({
  email: z.string().email("Invalid email format provided"),
});

export const verifyRegistrationResponseSchema = z.object({
  email: z.string().email(),
  deviceName: z.string().optional(),
  encryptedMEK: z.string().optional(),
  registrationResponse: z.any(), // Passes through to simplewebauthn
});

export const generateLoginOptionsSchema = z.object({
  email: z.string().email("Invalid email format provided"),
});

export const verifyLoginResponseSchema = z.object({
  email: z.string().email(),
  authenticationResponse: z.any(), // Passes through to simplewebauthn
});

export const passwordRegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const passwordLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "OTP must be exactly 6 digits"),
});

export const refreshTokensSchema = z.object({
  refreshToken: z.string().min(3, "Invalid length for refresh token"),
});
