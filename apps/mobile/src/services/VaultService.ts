import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@libs/database/schema';
import { eq, desc, isNull, and } from 'drizzle-orm';
import { VaultSecretT } from '@src/types/vault';
import { decryptData } from '@securevault/crypto';
import { DeviceStoreManager } from '@store/device';
import { logger } from '@securevault/utils-native';
import { z } from 'zod';
import { VaultItemSchema } from '@utils/validators/vault';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

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
  ) {}

  /**
   * Add or update a vault item locally.
   * Ensures data integrity via Zod and enforces user isolation.
   */
  async saveVaultItem(input: unknown) {
    logger.info('Attempting to save vault item', { userId: !!this.userId });

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
    logger.info('Requesting soft delete for vault item', { vaultId: id });

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

      logger.info('Vault item soft-deleted successfully', { vaultId: id });
      return result;
    } catch (error) {
      logger.error('Failed to delete vault item', {
        vaultId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get paginated non-deleted vault items for the current user and decrypt them.
   */
  async getVaultItems({
    limit = 20,
    offset = 0,
  }: { limit?: number; offset?: number } = {}): Promise<VaultSecretT[]> {
    logger.log('Fetching local vault items', { limit, offset });

    try {
      const entries = await this.db
        .select()
        .from(schema.vault)
        .where(
          and(
            isNull(schema.vault.deletedAt),
            eq(schema.vault.userId, this.userId), // Security: Enforce user isolation
            eq(schema.vault.isCorrupted, false)
          )
        )
        .orderBy(desc(schema.vault.updatedAt))
        .limit(limit)
        .offset(offset);

      if (entries.length === 0) {
        logger.info('No vault items found for user', {
          vaults: entries,
        });
        return [];
      }

      const mek = await DeviceStoreManager.getMek();

      if (!mek) {
        logger.error('Decryption aborted: Master Encryption Key (MEK) missing');
        return [];
      }

      const decryptedItems: VaultSecretT[] = [];

      for (const entry of entries) {
        if (!entry.encryptedData || !entry.iv) {
          logger.warn('Skipping corrupted vault entry', { vaultId: entry.id });
          continue;
        }

        try {
          const payload = await decryptData<VaultSecretT>(entry.encryptedData, entry.iv, mek);

          if (!payload) {
            logger.warn('Decryption returned null payload', { vaultId: entry.id });
            continue;
          }

          const transformed = this.transformToVaultSecret(entry.id, payload, entry.version);
          if (transformed) {
            decryptedItems.push(transformed);
          }
        } catch (err) {
          logger.error('Failed to decrypt vault entry - marking as corrupted', {
            id: entry.id,
            error: err instanceof Error ? err.message : String(err),
          });

          try {
            // Mark as corrupted to avoid trying again
            await this.db
              .update(schema.vault)
              .set({ isCorrupted: true })
              .where(eq(schema.vault.id, entry.id))
              .execute();
          } catch (error) {
            logger.error('Failed to mark vault entry as corrupted', {
              id: entry.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      return decryptedItems;
    } catch (error) {
      logger.error('Failed to retrieve vault items', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Transforms raw decrypted payload into a structured VaultSecretT
   * Centralizes mapping logic for easier maintenance.
   */
  private transformToVaultSecret(id: string, payload: any, version: number): VaultSecretT {
    if (!payload) return null as any;

    try {
      // Step 0: Robust payload detection (handle potential double-serialization from user manual stringification)
      let data = payload;
      if (typeof payload === 'string') {
        try {
          data = JSON.parse(payload);
        } catch (e) {
          logger.warn('Failed to parse payload string - using raw string', { id });
        }
      }

      // 1. Detect dynamic Secret format (presence of fields array)
      if (data.fields && Array.isArray(data.fields)) {
        return {
          ...data,
          id, // Ensure database ID matches the object ID
          version,
        } as VaultSecretT;
      }

      // 2. Handle legacy Card format
      const isCard = !!data.cardNumber || data.type === 'card';
      if (isCard) {
        return {
          id,
          type: 'card',
          serviceName: data.serviceName || 'Unknown Card',
          cardholderName: data.cardName || data.cardholderName || '',
          cardNumber: data.cardNumber || '',
          expirationDate: data.exp || data.expirationDate || '',
          cvv: data.cvv || '',
          note: data.note || '',
          meta: data.meta || {
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          version,
        } as VaultSecretT;
      }

      // 3. Fallback to legacy Password format
      return {
        id,
        type: 'login',
        serviceName: data.serviceName || 'Unknown',
        website: data.url ?? data.website ?? '',
        username: data.username ?? '',
        secretInfo: data.password ?? data.secretInfo ?? '',
        note: data.note || '',
        meta: data.meta || {
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        version,
      } as VaultSecretT;
    } catch (err) {
      logger.error('Transformation failed for vault item', { id, error: err });
      return null as any;
    }
  }

  /**
   * Update an existing vault item by id.
   * Re-stores the encrypted blob and refreshes updatedAt.
   * userId is intentionally excluded from .set() to prevent IDOR.
   */
  async updateVaultItem(input: unknown) {
    logger.info('Attempting to update vault item', { userId: !!this.userId });

    try {
      const data = VaultItemSchema.parse(input);

      const result = await this.db
        .update(schema.vault)
        .set({
          encryptedData: data.encryptedData,
          iv: data.iv,
          version: data.version,
          deletedAt: data.deletedAt,
          updatedAt: new Date(),
          // userId intentionally excluded — IDOR protection
        })
        .where(
          and(
            eq(schema.vault.id, data.id),
            eq(schema.vault.userId, this.userId) // user may only update their own records
          )
        );

      logger.info('Vault item updated successfully', { id: data.id });
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('Validation failed for updateVaultItem', { errors: error.errors });
        throw new Error('Invalid vault data');
      }

      logger.error('Failed to update vault item', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
