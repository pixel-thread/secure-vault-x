import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '../libs/database/schema';
import { eq, desc, isNull } from 'drizzle-orm';
import { VaultSecretT } from '../types/vault';
import { decryptData } from '@securevault/crypto';
import { DeviceStoreManager } from '../store/device';
import { logger } from '@securevault/utils-native';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export class VaultService {
  private db: DrizzleDB;
  private userId: string;

  constructor(db: DrizzleDB, userId: string) {
    this.db = db;
    this.userId = userId;
  }

  /**
   * Add or update a vault item locally
   */
  async saveVaultItem(data: {
    id: string;
    encryptedData: string;
    iv: string;
    version?: number;
    deletedAt?: Date | null;
  }) {
    return await this.db
      .insert(schema.vault)
      .values({
        id: data.id,
        userId: this.userId,
        encryptedData: data.encryptedData,
        iv: data.iv,
        version: data.version ?? 1,
        updatedAt: new Date(),
        deletedAt: data.deletedAt ?? null,
      })
      .onConflictDoUpdate({
        target: schema.vault.id,
        set: {
          encryptedData: data.encryptedData,
          iv: data.iv,
          version: data.version ?? 1,
          updatedAt: new Date(),
          deletedAt: data.deletedAt ?? null,
        },
      });
  }

  /**
   * Soft delete a vault item locally
   */
  async deleteVaultItem(id: string) {
    return await this.db
      .update(schema.vault)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.vault.id, id));
  }

  /**
   * Get all non-deleted vault items from local DB and decrypt them
   */
  async getVaultItems(): Promise<VaultSecretT[]> {
    const entries = await this.db
      .select()
      .from(schema.vault)
      .where(isNull(schema.vault.deletedAt))
      .orderBy(desc(schema.vault.updatedAt));

    if (entries.length === 0) return [];

    const mek = await DeviceStoreManager.getMek();

    if (!mek) {
      logger.error('Vault decrypt failed: MEK not found');
      return [];
    }

    const decrypted: VaultSecretT[] = [];

    for (const entry of entries) {
      if (!entry.encryptedData || !entry.iv) continue;
      try {
        const payload = await decryptData<any>(entry.encryptedData, entry.iv, mek);

        const isCard = !!payload.cardNumber;

        if (isCard) {
          decrypted.push({
            id: entry.id,
            type: 'card',
            serviceName: payload.serviceName || 'Unknown Card',
            cardholderName: payload.cardName || '',
            cardNumber: payload.cardNumber || '',
            expirationDate: payload.exp || '',
            cvv: payload.cvv || '',
            note: payload.note,
          });
        } else {
          decrypted.push({
            id: entry.id,
            type: 'password',
            serviceName: payload.serviceName || 'Unknown',
            website: payload.url ?? '',
            username: payload.username ?? '',
            secretInfo: payload.password ?? '',
            note: payload.note,
          });
        }
      } catch (err) {
        logger.error('Failed to decrypt local vault entry', {
          id: entry.id,
          error: err instanceof Error ? err.message : err,
          dataLength: entry.encryptedData?.length,
          ivLength: entry.iv?.length,
        });
      }
    }

    return decrypted;
  }
}
