import { z } from "zod";

// ==========================================
// VAULT SCHEMAS
// ==========================================

export const syncVaultSchema = z
  .object({
    encryptedData: z.string().min(1, "Vault blob cannot be empty"),
    version: z.number().positive(),
  })
  .strict();

export const addSecretSchema = z.object({
  encryptedData: z.string().min(1, "Vault blob cannot be empty"),
  iv: z.string().min(1, "iv cannot be empty"),
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
