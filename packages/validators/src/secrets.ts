import { z } from "zod";
import { SecretType } from "@securevault/types";

// Base schema for common fields
const baseSecretSchema = {
  title: z
    .string({ required_error: "Title is required" })
    .min(1, "Title is required")
    .max(100, "Title is too long"),
  note: z.string().max(1000, "Note is too long").optional(),
};

export const loginSchema = z.object({
  ...baseSecretSchema,
  Username: z.string().min(1, "Username is required"),
  Password: z.string().min(1, "Password is required"),
  "Website URL": z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const cardSchema = z.object({
  ...baseSecretSchema,
  "Cardholder Name": z.string().min(1, "Name on card is required"),
  "Card Number": z
    .string()
    .regex(/^\d{13,19}$/, "Card number must be 13-19 digits"),
  "Expiry Date": z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format"),
  CVV: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
});

export const apiKeySchema = z.object({
  ...baseSecretSchema,
  "Service Name": z.string().min(1, "Service name is required"),
  "API Key": z.string().min(1, "API key is required"),
  "Base URL": z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const databaseSchema = z.object({
  ...baseSecretSchema,
  "DB Name": z.string().min(1, "Database name is required"),
  "Connection URL": z.string().min(1, "Connection URL is required"),
  Username: z.string().optional(),
  Password: z.string().optional(),
});

export const cryptoSchema = z.object({
  ...baseSecretSchema,
  "Wallet Name": z.string().min(1, "Wallet name is required"),
  Address: z.string().min(1, "Address is required"),
  "Seed Phrase": z.string().min(1, "Seed phrase is required"),
});

export const identitySchema = z.object({
  ...baseSecretSchema,
  "Document Type": z.string().min(1, "Document type is required"),
  "ID Number": z.string().min(1, "ID number is required"),
  "Expiry Date": z.string().optional(),
});

export const secureNoteSchema = z.object({
  ...baseSecretSchema,
  Title: z.string().min(1, "Content title is required"),
  Content: z.string().min(1, "Content is required"),
});

export const fileSchema = z.object({
  ...baseSecretSchema,
  fileName: z.string().min(1, "File name is required"),
  fileSize: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB"),
  contentType: z.string().min(1, "Content type is required"),
  base64Data: z.string().min(1, "File data is missing"),
});

/**
 * Returns the appropriate Zod schema for a given secret type.
 * Used by the frontend forms to enforce type-specific validation.
 */
export function getSecretSchema(type: SecretType) {
  switch (type) {
    case "login":
      return loginSchema;
    case "card":
      return cardSchema;
    case "api_key":
      return apiKeySchema;
    case "database":
      return databaseSchema;
    case "crypto":
      return cryptoSchema;
    case "identity":
      return identitySchema;
    case "secure_note":
      return secureNoteSchema;
    case "file":
      return fileSchema;
    default:
      // Fallback for custom or unmapped types
      return z
        .object({
          ...baseSecretSchema,
        })
        .passthrough();
  }
}
