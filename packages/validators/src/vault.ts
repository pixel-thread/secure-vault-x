import { z } from 'zod';

// ==========================================
// VAULT SCHEMAS
// ==========================================

export const syncVaultSchema = z.object({
 encryptedData: z.string().min(1, 'Vault blob cannot be empty'),
 version: z.number().int().nonnegative('Version must be a positive integer'),
}).strict();
