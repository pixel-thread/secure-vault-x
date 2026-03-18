import { z } from 'zod';

/**
 * Zod schema for Vault Item input validation (OWASP A04: Insecure Design)
 */
export const VaultItemSchema = z.object({
  id: z.string().uuid(),
  encryptedData: z.string().min(1),
  iv: z.string().min(1),
  version: z.number().int().optional().default(1),
  isCorrupted: z.boolean().optional().default(false),
  deletedAt: z.date().nullable().optional(),
});
