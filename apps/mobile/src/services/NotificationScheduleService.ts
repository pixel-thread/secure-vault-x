import * as Notifications from 'expo-notifications';
import { eq, and } from 'drizzle-orm';
import { logger } from '@securevault/utils-native';
import { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '@libs/database/schema';
import { VaultSecretT } from '@src/types/vault';
import { v4 as uuidv4 } from 'uuid';

export class NotificationScheduleService {
  private db: ExpoSQLiteDatabase<typeof schema>;

  constructor(db: ExpoSQLiteDatabase<typeof schema>) {
    this.db = db;
  }

  /**
   * Schedules notifications for a specific vault item based on its type and expiry/rotation fields.
   */
  async scheduleForItem(item: VaultSecretT): Promise<void> {
    try {
      // 1. Cancel existing pending notifications for this item
      await this.cancelForItem(item.id);

      // 2. Identify rotation/expiry triggers from the decrypted payload
      const schedules = this.calculateSchedules(item);
      if (schedules.length === 0) return;

      // 3. Request permissions (silent check)
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('[NotificationScheduleService] Notification permissions not granted');
        // We still save to DB so we can reconcile later if they enable it
      }

      for (const sched of schedules) {
        let expoNotifId: string | null = null;

        if (status === 'granted' && sched.scheduledFor > Date.now()) {
          expoNotifId = await Notifications.scheduleNotificationAsync({
            content: {
              title: sched.title,
              body: sched.body,
              data: {
                item_id: item.id,
                item_type: item.type,
                action: 'open_item',
              },
            },
            // @ts-ignore - type 'timeInterval' is used for exact seconds triggering in newer Expo versions
            trigger: {
              type: 'timeInterval',
              seconds: Math.floor((sched.scheduledFor - Date.now()) / 1000),
              repeats: false,
            },
          });
        }

        await this.db.insert(schema.notificationSchedule).values({
          id: uuidv4(),
          itemId: item.id,
          itemType: item.type,
          notificationType: sched.type,
          scheduledFor: sched.scheduledFor,
          expoNotifId,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      logger.info(`[NotificationScheduleService] Scheduled ${schedules.length} notifications`);
    } catch (error) {
      logger.error('[NotificationScheduleService] Internal scheduling error', error);
    }
  }

  /**
   * Schedules a near-immediate test notification for development purposes.
   */
  async scheduleTest(item: VaultSecretT, delayMs: number = 5000): Promise<string | null> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== 'granted') return null;
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🧪 Test Alert: ${item.type}`,
          body: `This is a test rotation alert for ${item.id.slice(0, 8)}.`,
          data: {
            item_id: item.id,
            action: 'open_item',
          },
        },
        // @ts-ignore - type 'timeInterval' is used for exact seconds triggering in newer Expo versions
        trigger: {
          type: 'timeInterval',
          seconds: Math.floor(delayMs / 1000),
          repeats: false,
        },
      });

      logger.info(`[NotificationScheduleService] Test notification scheduled in ${delayMs}ms`);
      return id;
    } catch (error) {
      logger.error('[NotificationScheduleService] Test schedule failed', error);
      return null;
    }
  }

  /**
   * Cancels all pending notifications for an item in both the OS and the DB.
   */
  async cancelForItem(itemId: string): Promise<void> {
    const pending = await this.db
      .select()
      .from(schema.notificationSchedule)
      .where(
        and(
          eq(schema.notificationSchedule.itemId, itemId),
          eq(schema.notificationSchedule.status, 'pending'),
        ),
      );

    for (const row of pending) {
      if (row.expoNotifId) {
        await Notifications.cancelScheduledNotificationAsync(row.expoNotifId);
      }
    }

    await this.db
      .update(schema.notificationSchedule)
      .set({ status: 'cancelled', updatedAt: Date.now() })
      .where(
        and(
          eq(schema.notificationSchedule.itemId, itemId),
          eq(schema.notificationSchedule.status, 'pending'),
        ),
      );
  }

  /**
   * Cancels all pending notifications globally (e.g. when user toggles off).
   */
  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await this.db
      .update(schema.notificationSchedule)
      .set({ expoNotifId: null, updatedAt: Date.now() })
      .where(eq(schema.notificationSchedule.status, 'pending'));

    logger.info('[NotificationScheduleService] Cancelled all OS notifications');
  }

  /**
   * Re-registers future notifications (e.g. after toggle on or device reboot).
   */
  async reconcile(vaultItems: VaultSecretT[]): Promise<void> {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // Reschedule all items to ensure OS has them
    for (const item of vaultItems) {
      await this.scheduleForItem(item);
    }
  }

  private calculateSchedules(item: VaultSecretT): Array<{
    type: string;
    scheduledFor: number;
    title: string;
    body: string;
  }> {
    const schedules: Array<{ type: string; scheduledFor: number; title: string; body: string }> =
      [];
    const now = Date.now();

    // Mapping logic to handle different secret structures
    const type = item.type;
    const meta = item.meta;
    const title = item.title || 'Secret';

    if (['login', 'api_key', 'database'].includes(type)) {
      if (meta?.autoRotateDays && meta?.updatedAt) {
        const nextRotation = meta.updatedAt + meta.autoRotateDays * 86400000;

        if (nextRotation) {
          // 7 days before
          if (nextRotation - 7 * 86400000 > now) {
            schedules.push({
              type: 'rotation',
              scheduledFor: nextRotation - 7 * 86400000,
              title: '🔑 Password Rotation Due',
              body: `Your login for ${title} is due for rotation in 7 days.`,
            });
          }
          // 4 days before
          if (nextRotation - 4 * 86400000 > now) {
            schedules.push({
              type: 'rotation',
              scheduledFor: nextRotation - 4 * 86400000,
              title: '🔑 Password Rotation Due',
              body: `Your login for ${title} is due for rotation in 4 days.`,
            });
          }
          // Day of
          if (nextRotation > now) {
            schedules.push({
              type: 'rotation',
              scheduledFor: nextRotation,
              title: '🔑 Password Rotation Overdue',
              body: `Your login for ${title} is due for rotation today.`,
            });
          }
        }
      }
    }

    // Add card/identity expiry logic here...
    if (item.type === 'card') {
      const expField = item.fields?.find((f) => f.label.toLowerCase().includes('exp'))?.value;
      if (expField && expField.includes('/')) {
        // Parsing MM/YY to first day of month
        const [mm, yy] = expField.split('/');
        const expiryDate = new Date(parseInt(`20${yy}`), parseInt(mm) - 1, 1).getTime();
        const notifyDaysBefore = 30;

        const cardNumField =
          item.fields?.find((f) => f.label.toLowerCase().includes('card number'))?.value || '';
        const last4 = cardNumField.slice(-4);

        if (expiryDate - notifyDaysBefore * 86400000 > now) {
          schedules.push({
            type: 'expiry',
            scheduledFor: expiryDate - notifyDaysBefore * 86400000,
            title: '💳 Card Expiring Soon',
            body: `Your card ending ${last4} expires soon.`,
          });
        }
      }
    }

    return schedules;
  }
}
