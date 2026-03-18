import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@libs/database/schema';
import type { SyncService } from '@services/SyncService';

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export type SyncServiceT = SyncService;
