import { SYNC_ENDPOINT } from '@securevault/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '../libs/database/schema';
import { eq, gt } from 'drizzle-orm';
import { http, logger } from '@securevault/utils-native';

const LAST_SYNCED_KEY = 'last_synced_at';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export class SyncService {
  private db: DrizzleDB;
  private userId: string;
  private _isSyncing: boolean = false;
  private onStatusChange?: (isSyncing: boolean) => void;

  constructor(db: DrizzleDB, userId: string, onStatusChange?: (isSyncing: boolean) => void) {
    this.db = db;
    this.userId = userId;
    this.onStatusChange = onStatusChange;
  }

  /**
   * Getter to check if a sync is currently in progress
   */
  public get isSyncing(): boolean {
    return this._isSyncing;
  }

  /**
   * Internal helper to update state and notify listeners
   */
  private setSyncing(state: boolean) {
    this._isSyncing = state;
    if (this.onStatusChange) {
      this.onStatusChange(state);
    }
  }

  /**
   * Main entry point for synchronization
   */
  async sync() {
    // Prevent sync if no user or if already running
    if (!this.userId || this._isSyncing) {
      logger.log('Sync skipped: User missing or sync already in progress');
      return;
    }

    this.setSyncing(true);
    logger.log('Starting sync for user:', this.userId);

    try {
      // Run push and pull sequentially
      await this.push();
      await this.pull();
      logger.log('Sync completed successfully:', this.userId);
    } catch (error) {
      logger.error('Sync failed:', error);
      throw error; // Re-throw so UI can handle specific errors if needed
    } finally {
      // Ensure state is reset regardless of success or failure
      this.setSyncing(false);
    }
  }

  private async pull() {
    const storageKey = `${LAST_SYNCED_KEY}_${this.userId}`;
    const lastSyncedAt = await AsyncStorage.getItem(storageKey);
    const since = lastSyncedAt ? lastSyncedAt : '0';

    const response = await http.get<{ items: any[]; serverTime: number }>(
      SYNC_ENDPOINT.GET_SYNC.replace(':since', since)
    );

    if (!response?.data) return;

    const { items, serverTime } = response.data;

    // Use a transaction for better performance on bulk updates
    await this.db.transaction(async (tx) => {
      for (const item of items) {
        const existing = await tx.query.vault.findFirst({
          where: eq(schema.vault.id, item.id),
        });

        // Simple Last-Write-Wins (LWW) conflict resolution
        const isNewer = !existing || new Date(item.updatedAt) > new Date(existing.updatedAt);

        if (isNewer) {
          logger.log(`[Sync Pull] Updating record: ${item.id}`);

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

    await AsyncStorage.setItem(storageKey, serverTime.toString());
  }

  private async push() {
    const storageKey = `${LAST_SYNCED_KEY}_${this.userId}`;
    const lastSyncedAt = await AsyncStorage.getItem(storageKey);

    // 30s buffer helps with edge cases where client/server clocks are slightly off
    const sinceDate = lastSyncedAt ? new Date(parseInt(lastSyncedAt) - 30000) : new Date(0);

    // Fetch local changes that haven't been pushed yet
    const changes = await this.db
      .select()
      .from(schema.vault)
      .where(gt(schema.vault.updatedAt, sinceDate));

    if (changes.length === 0) {
      logger.log('[Sync Push] No local changes found.');
      return;
    }

    logger.log(`[Sync Push] Pushing ${changes.length} items to server.`);

    await http.post(SYNC_ENDPOINT.POST_SYNC_PUSH, {
      items: changes.map((c) => ({
        id: c.id,
        encryptedData: c.encryptedData,
        iv: c.iv,
        version: c.version,
        updatedAt: c.updatedAt.getTime(),
        deletedAt: c.deletedAt ? c.deletedAt.getTime() : null,
      })),
    });
  }
}
