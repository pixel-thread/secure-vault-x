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
