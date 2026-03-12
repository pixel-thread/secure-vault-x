import { z } from "zod";

// ==========================================
// VAULT SCHEMAS
// ==========================================

const versionValidiation = z
  .number({
    message: "Version cannot be empty",
    invalid_type_error: "Version must be a number",
    required_error: "Version cannot be empty",
  })
  .positive("Version must be positive");

const encryptedDataValidation = z
  .string({
    message: "Vault blob cannot be empty",
    invalid_type_error: "Vault data must be a string",
    required_error: "Vault blob cannot be empty",
  })
  .min(1, "Vault blob cannot be empty");

const ivValidation = z
  .string({
    message: "iv cannot be empty",
    required_error: "iv cannot be empty",
  })
  .min(1, "iv cannot be empty");

const dateValidation = z.union([z.string().datetime(), z.number()]);

export const syncVaultSchema = z
  .object({
    encryptedData: encryptedDataValidation,
    version: versionValidiation,
  })
  .strict();

export const addSecretSchema = z.object({
  encryptedData: encryptedDataValidation,
  iv: ivValidation,
});

export const syncItemSchema = z.object({
  id: z
    .string({ message: "Vault id cannot be empty" })
    .uuid("Invalid vault id")
    .optional(),
  encryptedData: encryptedDataValidation,
  iv: ivValidation.optional(),
  version: versionValidiation,
  updatedAt: dateValidation,
  deletedAt: dateValidation.nullable().optional(),
});

export const syncPushSchema = z.object({
  items: z.array(syncItemSchema),
});

export const syncPullSchema = z.object({
  since: z.union([z.string().datetime(), z.string().regex(/^\d+$/)]).optional(),
});

export const syncItemSchema = z.object({
  id: z.string().uuid().optional(),
  encryptedData: z.string().min(1, "Vault blob cannot be empty"),
  iv: z.string().optional(),
  version: z.number().int().positive(),
  updatedAt: z.union([z.string().datetime(), z.number()]),
  deletedAt: z.union([z.string().datetime(), z.number()]).nullable().optional(),
});

export const syncPushSchema = z.object({
  items: z.array(syncItemSchema),
});

export const syncPullSchema = z.object({
  since: z.union([z.string().datetime(), z.string().regex(/^\d+$/)]).optional(),
});
