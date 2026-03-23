import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const vault = sqliteTable('vault', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  encryptedData: text('encrypted_data').notNull(),
  iv: text('iv'),
  version: integer('version').default(1).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  isCorrupted: integer('is_corrupted', { mode: 'boolean' }).default(false).notNull(),
  corruptedAt: integer('corrupted_at', { mode: 'timestamp' }),
});

export const notificationSchedule = sqliteTable('notification_schedule', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull(),
  itemType: text('item_type').notNull(),
  notificationType: text('notification_type').notNull(),
  scheduledFor: integer('scheduled_for').notNull(),
  expoNotifId: text('expo_notif_id'),
  firedAt: integer('fired_at'),
  dismissedAt: integer('dismissed_at'),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at')
    .notNull()
    .$defaultFn(() => Date.now()),
});

export type Vault = typeof vault.$inferSelect;
export type NewVault = typeof vault.$inferInsert;

export type NotificationSchedule = typeof notificationSchedule.$inferSelect;
export type NewNotificationSchedule = typeof notificationSchedule.$inferInsert;
