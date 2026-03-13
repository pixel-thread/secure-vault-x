import { z } from "zod";
import { passwordSchema } from "./common";

// ==========================================
// AUTHENTICATION SCHEMAS
// ==========================================

const emailValidiation = z
  .string({
    required_error: "Email is required",
    message: "Invalid email format provided",
    invalid_type_error: "Email must be a string",
  })
  .email("Invalid email format provided");

export const generateRegistrationOptionsSchema = z.object({
  email: emailValidiation,
});

export const verifyRegistrationResponseSchema = z.object({
  email: emailValidiation,
  deviceName: z
    .string({
      required_error: "Device name is required",
      invalid_type_error: "Device name must be a string",
    })
    .optional(),
  publicKey: z
    .string({
      required_error: "Public key is required",
      invalid_type_error: "Public key must be a string",
    })
    .optional(),
  encryptedMEK: z
    .string({
      required_error: "Mek  is required",
      invalid_type_error: "Mek must be a string",
    })
    .optional(),
  registrationResponse: z.record(z.any()), // WebAuthn registration response object
});

export const generateLoginOptionsSchema = z.object({
  email: emailValidiation,
});

export const verifyLoginResponseSchema = z.object({
  email: emailValidiation,
  authenticationResponse: z.record(z.any()), // WebAuthn authentication response object
});

export const passwordRegisterSchema = z
  .object({
    email: emailValidiation,
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
  email: emailValidiation,
  password: passwordSchema,
});

export const verifyOtpSchema = z.object({
  email: emailValidiation,
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
  deviceName: z
    .string({
      required_error: "Device name is required",
      invalid_type_error: "Device name must be a string",
    })
    .min(1, "Device name is required")
    .max(100),
  deviceIdentifier: z
    .string({
      required_error: "Device identifier is required",
      invalid_type_error: "Device identifier must be a string",
    })
    .optional(),
  publicKey: z
    .string({
      required_error: "Public key is required",
      invalid_type_error: "Public key must be a string",
    })
    .optional(),
});

export const toggleTrustDeviceSchema = z.object({
  isTrusted: z
    .boolean({
      message: "isTrusted is required",
      required_error: "isTrusted is required",
    })
    .catch(false),
});

// ==========================================
// MFA SCHEMAS
// ==========================================

export const toggleMfaSchema = z.object({
  enabled: z.boolean({ message: "enabled is required" }).catch(false),
});
