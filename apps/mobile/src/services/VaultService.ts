import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '../libs/database/schema';
import { eq, desc, isNull, and } from 'drizzle-orm';
import { VaultSecretT } from '../types/vault';
import { decryptData } from '@securevault/crypto';
import { DeviceStoreManager } from '../store/device';
import { logger } from '@securevault/utils-native';
import { z } from 'zod';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Zod schema for Vault Item input validation (OWASP A04: Insecure Design)
 */
const VaultItemSchema = z.object({
  id: z.string().uuid(),
  encryptedData: z.string().min(1),
  iv: z.string().min(1),
  version: z.number().int().optional().default(1),
  deletedAt: z.date().nullable().optional(),
});

/**
 * Service for managing local vault data with security isolation and detailed logging.
 */
export class VaultService {
  /**
   * @param db Drizzle database instance
   * @param userId Currectly authenticated user's ID (OWASP A01: Broken Access Control)
   */
  constructor(
    private readonly db: DrizzleDB,
    private readonly userId: string
  ) { }

  /**
   * Add or update a vault item locally.
   * Ensures data integrity via Zod and enforces user isolation.
   */
  async saveVaultItem(input: unknown) {
    logger.info('Attempting to save vault item', { userId: this.userId });

    try {
      // Validate input schema
      const data = VaultItemSchema.parse(input);

      const values = {
        ...data,
        userId: this.userId, // Enforce current user
        updatedAt: new Date(),
        deletedAt: data.deletedAt ?? null,
      };

      const result = await this.db
        .insert(schema.vault)
        .values(values)
        .onConflictDoUpdate({
          target: schema.vault.id,
          set: {
            encryptedData: values.encryptedData,
            iv: values.iv,
            version: values.version,
            updatedAt: values.updatedAt,
            deletedAt: values.deletedAt,
            // userId is NOT updated to prevent IDOR
          },
        });

      logger.info('Vault item saved successfully', { id: data.id });
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation failed for saveVaultItem', { errors: error.errors });
        throw new Error('Invalid vault data');
      }

      logger.error('Failed to save vault item', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Soft delete a vault item locally.
   * Enforces user isolation to prevent unauthorized deletions (IDOR).
   */
  async deleteVaultItem(id: string) {
    logger.info('Requesting soft delete for vault item', { id, userId: this.userId });

    try {
      const result = await this.db
        .update(schema.vault)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.vault.id, id),
            eq(schema.vault.userId, this.userId) // Security: Prevent cross-user deletion
          )
        );

      logger.info('Vault item soft-deleted successfully', { id });
      return result;
    } catch (error) {
      logger.error('Failed to delete vault item', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get all non-deleted vault items for the current user and decrypt them.
   */
  async getVaultItems(): Promise<VaultSecretT[]> {
    logger.log('Fetching local vault items', { userId: this.userId });

    try {
      const entries = await this.db
        .select()
        .from(schema.vault)
        .where(
          and(
            isNull(schema.vault.deletedAt),
            eq(schema.vault.userId, this.userId) // Security: Enforce user isolation
          )
        )
        .orderBy(desc(schema.vault.updatedAt));

      if (entries.length === 0) {
        logger.info('No vault items found for user', { userId: this.userId });
        return [];
      }

      const mek = await DeviceStoreManager.getMek();
      if (!mek) {
        logger.error('Decryption aborted: Master Encryption Key (MEK) missing');
        return [];
      }

      logger.log(`Beginning decryption for ${entries.length} items`);
      const decryptedItems: VaultSecretT[] = [];

      for (const entry of entries) {
        if (!entry.encryptedData || !entry.iv) {
          logger.warn('Skipping corrupted vault entry', { id: entry.id });
          continue;
        }

        try {
          const payload = await decryptData<any>(entry.encryptedData, entry.iv, mek);
          decryptedItems.push(this.transformToVaultSecret(entry.id, payload));
        } catch (err) {
          logger.error('Failed to decrypt vault entry', {
            id: entry.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      logger.info(`Successfully processed ${decryptedItems.length}/${entries.length} items`);
      return decryptedItems;
    } catch (error) {
      logger.error('Failed to retrieve vault items', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Transforms raw decrypted payload into a structured VaultSecretT
   * Centralizes mapping logic for easier maintenance.
   */
  private transformToVaultSecret(id: string, payload: any): VaultSecretT {
    const isCard = !!payload.cardNumber;

    if (isCard) {
      return {
        id,
        type: 'card',
        serviceName: payload.serviceName || 'Unknown Card',
        cardholderName: payload.cardName || '',
        cardNumber: payload.cardNumber || '',
        expirationDate: payload.exp || '',
        cvv: payload.cvv || '',
        note: payload.note,
      };
    }

    return {
      id,
      type: 'password',
      serviceName: payload.serviceName || 'Unknown',
      website: payload.url ?? '',
      username: payload.username ?? '',
      secretInfo: payload.password ?? '',
      note: payload.note,
    };
  }
}
