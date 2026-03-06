import { z } from "zod";
import { passwordSchema } from "./common";

// ==========================================
// AUTHENTICATION SCHEMAS
// ==========================================

export const generateRegistrationOptionsSchema = z.object({
  email: z.string().email("Invalid email format provided"),
});

export const verifyRegistrationResponseSchema = z.object({
  email: z.string().email(),
  deviceName: z.string().optional(),
  publicKey: z.string().optional(),
  encryptedMEK: z.string().optional(),
  registrationResponse: z.record(z.any()), // WebAuthn registration response object
});

export const generateLoginOptionsSchema = z.object({
  email: z.string().email("Invalid email format provided"),
});

export const verifyLoginResponseSchema = z.object({
  email: z.string().email(),
  authenticationResponse: z.record(z.any()), // WebAuthn authentication response object
});

export const passwordRegisterSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const passwordLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: passwordSchema,
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits")
    .length(6, "OTP must be exactly 6 digits"),
});

export const revokeOtpSchema = z.object({
  otpId: z.string().uuid("Invalid OTP ID"),
});

export const refreshTokensSchema = z.object({
  refreshToken: z.string().min(3, "Invalid length for refresh token"),
});

export const setEncryptionSaltSchema = z.object({
  salt: z.string().min(1, "Salt is required"),
});

// ==========================================
// DEVICE SCHEMAS
// ==========================================

export const registerDeviceSchema = z.object({
  deviceName: z.string().min(1, "Device name is required").max(100),
  deviceIdentifier: z.string().optional(),
  publicKey: z.string().optional(),
});

export const toggleTrustDeviceSchema = z.object({
  isTrusted: z.boolean(),
});

// ==========================================
// MFA SCHEMAS
// ==========================================

export const toggleMfaSchema = z.object({
  enabled: z.boolean(),
});
