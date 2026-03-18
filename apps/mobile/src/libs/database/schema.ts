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
});

export type Vault = typeof vault.$inferSelect;
export type NewVault = typeof vault.$inferInsert;
