import { SYNC_ENDPOINT } from '@securevault/constants';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@libs/database/schema';
import { eq, gt, and } from 'drizzle-orm';
import { http, logger } from '@securevault/utils-native';
import { SyncStoreManager } from '@store/sync';
import { syncItemSchema } from '@securevault/validators';
import { z } from 'zod';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Service to synchronize local vault data with the remote server.
 * Implements security checks (OWASP A01) and efficient push/pull logic.
 */
export class SyncService {
  private _isSyncing: boolean = false;

  constructor(
    private readonly db: DrizzleDB,
    private readonly userId: string,
    private readonly onStatusChange?: (isSyncing: boolean) => void
  ) {}

  /**
   * Status check for UI components
   */
  public get isSyncing(): boolean {
    return this._isSyncing;
  }

  /**
   * Main sync coordinator
   */
  async sync() {
    if (!this.userId || this._isSyncing) {
      logger.log('Sync skipped: User missing or already syncing');
      return;
    }

    this.updateSyncStatus(true);
    logger.info('Sync service started');

    try {
      await this.push();
      await this.pull();
      logger.info('Sync finished successfully');
    } catch (error) {
      logger.error('Sync process failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      this.updateSyncStatus(false);
    }
  }

  /**
   * Push local changes to server
   */
  private async push() {
    logger.log('[Sync] Push started');
    const lastSyncedAt = await this.getLastSyncedAt();
    const sinceDate = new Date(lastSyncedAt - 30000);

    const localChanges = await this.db
      .select()
      .from(schema.vault)
      .where(
        and(
          gt(schema.vault.updatedAt, sinceDate),
          eq(schema.vault.userId, this.userId),
          eq(schema.vault.isCorrupted, false) // OWASP: Only push healthy data
        )
      );

    if (localChanges.length === 0) {
      logger.log('[Sync] No local changes to push');
      return;
    }

    logger.info(`[Sync] Pushing ${localChanges.length} items to server`);

    try {
      const response = await http.post(SYNC_ENDPOINT.POST_SYNC_PUSH, {
        items: localChanges.map((item) => {
          // Robust handling of updatedAt which might be Date or timestamp
          const updatedTs = item.updatedAt instanceof Date 
            ? item.updatedAt.getTime() 
            : typeof item.updatedAt === 'number' 
              ? item.updatedAt 
              : Date.parse(String(item.updatedAt));

          const deletedTs = item.deletedAt 
            ? (item.deletedAt instanceof Date ? item.deletedAt.getTime() : typeof item.deletedAt === 'number' ? item.deletedAt : Date.parse(String(item.deletedAt)))
            : null;

          return {
            id: item.id,
            encryptedData: item.encryptedData,
            iv: item.iv,
            version: item.version,
            updatedAt: updatedTs,
            deletedAt: deletedTs,
          };
        }),
      });

      if (!response.success) {
        logger.error('[Sync] Push request failed', { message: response.message, error: response.error });
      } else {
        logger.info('[Sync] Push successful');
      }
    } catch (error) {
      logger.error('[Sync] Failed to push changes (exception)', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // OWASP: Propagate error to avoid silent failures
    }
  }

  /**
   * Pull server changes to local database
   */
  private async pull() {
    logger.log('[Sync] Pull started');
    const lastSyncedAt = await this.getLastSyncedAt();
    const url = SYNC_ENDPOINT.GET_SYNC.replace(':since', lastSyncedAt.toString());

    logger.info(`[Sync] Requesting pull from: ${url}`);

    const response = await http.get<{ items: unknown[]; serverTime: number }>(url);

    if (!response.success || !response.data) {
      logger.error('[Sync] Pull request failed', {
        message: response.message,
        error: response.error,
        success: response.success,
      });
      return;
    }

    const { items: rawItems, serverTime } = response.data;
    logger.log(`[Sync] Received ${rawItems.length} items from server`);

    // OWASP A04: Validation of server-supplied data before insertion
    const validationResult = z.array(syncItemSchema).safeParse(rawItems);
    
    if (!validationResult.success) {
      logger.error('[Sync] Pull data validation failed', { 
        errors: validationResult.error.flatten().fieldErrors 
      });
      return;
    }

    const items = validationResult.data;

    if (items.length > 0) {
      await this.db.transaction(async (tx) => {
        for (const item of items) {
          if (!item.id) {
            logger.warn('[Sync] Skipping item with missing ID');
            continue;
          }

          const existing = await tx.query.vault.findFirst({
            where: and(eq(schema.vault.id, item.id), eq(schema.vault.userId, this.userId)),
          });

          // If item is already marked as corrupted locally, skip it to honor user's directive
          if (existing?.isCorrupted) {
            logger.log(`[Sync] Skipping pull for corrupted item`, { id: item.id });
            continue;
          }

          const shouldUpdate = !existing || new Date(item.updatedAt) > new Date(existing.updatedAt);

          if (shouldUpdate) {
            await tx
              .insert(schema.vault)
              .values({
                id: item.id,
                userId: this.userId,
                encryptedData: item.encryptedData,
                iv: item.iv ?? null,
                version: item.version,
                updatedAt: new Date(item.updatedAt),
                deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
              })
              .onConflictDoUpdate({
                target: schema.vault.id,
                set: {
                  encryptedData: item.encryptedData,
                  iv: item.iv ?? null,
                  version: item.version,
                  updatedAt: new Date(item.updatedAt),
                  deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
                },
              });
          }
        }
      });
      logger.info(`[Sync] Successfully processed ${items.length} pull items`);
    } else {
      logger.info('[Sync] No server changes to pull');
    }

    if (serverTime) {
      await this.setLastSyncedAt(serverTime);
      logger.info(`[Sync] Updated lastSyncedAt to ${serverTime}`);
    }
  }

  private async getLastSyncedAt(): Promise<number> {
    const val = await SyncStoreManager.lastSyncAt({ userId: this.userId });
    return val ? parseInt(val) : 0;
  }

  private async setLastSyncedAt(time: number) {
    await SyncStoreManager.setLastSyncAt({ userId: this.userId, time: time });
  }

  private updateSyncStatus(isSyncing: boolean) {
    this._isSyncing = isSyncing;
    this.onStatusChange?.(isSyncing);
  }
}
