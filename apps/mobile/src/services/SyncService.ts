import { SYNC_ENDPOINT } from '@securevault/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '../libs/database/schema';
import { eq, gt, and } from 'drizzle-orm';
import { http, logger } from '@securevault/utils-native';

const LAST_SYNCED_KEY = 'last_synced_at';

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
    logger.info('Sync started', { userId: this.userId });

    try {
      await this.push();
      await this.pull();
      logger.info('Sync finished successfully');
    } catch (error) {
      logger.error('Sync failed', {
        userId: this.userId,
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
    const lastSyncedAt = await this.getLastSyncedAt();

    // Buffer for clock drift (30s)
    const sinceDate = new Date(lastSyncedAt - 30000);

    // Security: Only push changes belonging to the current user
    const localChanges = await this.db
      .select()
      .from(schema.vault)
      .where(and(gt(schema.vault.updatedAt, sinceDate), eq(schema.vault.userId, this.userId)));

    if (localChanges.length === 0) {
      logger.log('[Sync] No local changes to push');
      return;
    }

    logger.info(`[Sync] Pushing ${localChanges.length} items`);

    try {
      await http.post(SYNC_ENDPOINT.POST_SYNC_PUSH, {
        items: localChanges.map((item) => ({
          id: item.id,
          encryptedData: item.encryptedData,
          iv: item.iv,
          version: item.version,
          updatedAt: item.updatedAt.getTime(),
          deletedAt: item.deletedAt?.getTime() ?? null,
        })),
      });
    } catch (error) {
      logger.error('[Sync] Failed to push changes', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Pull server changes to local database
   */
  private async pull() {
    const lastSyncedAt = await this.getLastSyncedAt();

    const response = await http.get<{ items: any[]; serverTime: number }>(
      SYNC_ENDPOINT.GET_SYNC.replace(':since', lastSyncedAt.toString())
    );

    if (!response?.data) return;

    const { items, serverTime } = response.data;
    if (items.length === 0) return;

    logger.info(`[Sync] Pulling ${items.length} items`, {
      id: !!this.userId,
      dataLength: items.length,
    });

    await this.db.transaction(async (tx) => {
      for (const item of items) {
        // Enforce user isolation during update (OWASP A01)
        const existing = await tx.query.vault.findFirst({
          where: and(eq(schema.vault.id, item.id), eq(schema.vault.userId, this.userId)),
        });

        // Simple Last-Write-Wins (LWW) resolution
        const shouldUpdate = !existing || new Date(item.updatedAt) > new Date(existing.updatedAt);

        if (shouldUpdate) {
          await tx
            .insert(schema.vault)
            .values({
              id: item.id,
              userId: this.userId,
              encryptedData: item.encryptedData,
              iv: item.iv,
              version: item.version,
              updatedAt: new Date(item.updatedAt),
              deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
            })
            .onConflictDoUpdate({
              target: schema.vault.id,
              set: {
                encryptedData: item.encryptedData,
                iv: item.iv,
                version: item.version,
                updatedAt: new Date(item.updatedAt),
                deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
              },
            });
        }
      }
    });

    await this.setLastSyncedAt(serverTime);
  }

  private async getLastSyncedAt(): Promise<number> {
    const val = await AsyncStorage.getItem(`${LAST_SYNCED_KEY}_${this.userId}`);
    return val ? parseInt(val) : 0;
  }

  private async setLastSyncedAt(time: number) {
    await AsyncStorage.setItem(`${LAST_SYNCED_KEY}_${this.userId}`, time.toString());
  }

  private updateSyncStatus(isSyncing: boolean) {
    this._isSyncing = isSyncing;
    this.onStatusChange?.(isSyncing);
  }
}
