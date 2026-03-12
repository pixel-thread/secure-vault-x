import axios from 'axios';
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

  constructor(db: DrizzleDB, userId: string) {
    this.db = db;
    this.userId = userId;
  }

  async sync() {
    if (!this.userId) return;
    logger.log('Starting sync for user:', this.userId);
    try {
      await this.push();
      await this.pull();
      logger.log('Sync completed successfully:', this.userId);
    } catch (error) {
      logger.error('Sync failed:', error);
    }
  }

  private async pull() {
    const lastSyncedAt = await AsyncStorage.getItem(`${LAST_SYNCED_KEY}_${this.userId}`);
    const since = lastSyncedAt ? lastSyncedAt : '0';

    const response = await http.get<{ items: any[]; serverTime: number }>(
      SYNC_ENDPOINT.GET_SYNC.replace(':since', since)
    );

    if (!response?.data) return;

    const { items, serverTime } = response?.data;

    for (const item of items) {
      const existing = await this.db.query.vault.findFirst({
        where: eq(schema.vault.id, item.id),
      });

      if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
        logger.log(`[Sync Pull] Updating record: ${item.id}`, {
          hasData: !!item.encryptedData,
          ivLength: item.iv?.length,
          incomingUpdate: new Date(item.updatedAt).toISOString(),
          localUpdate: existing ? new Date(existing.updatedAt).toISOString() : 'none',
        });

        await this.db
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

    await AsyncStorage.setItem(`${LAST_SYNCED_KEY}_${this.userId}`, serverTime.toString());
  }

  private async push() {
    const lastSyncedAt = await AsyncStorage.getItem(`${LAST_SYNCED_KEY}_${this.userId}`);
    // Use a 30-second buffer to account for clock drift between device and server
    const since = lastSyncedAt ? new Date(parseInt(lastSyncedAt) - 30000) : new Date(0);

    // Get all local changes since last sync
    const changes = await this.db
      .select()
      .from(schema.vault)
      .where(gt(schema.vault.updatedAt, since));

    if (changes.length === 0) return;

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
