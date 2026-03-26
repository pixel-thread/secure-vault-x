import React, { useContext, useEffect } from 'react';
import { useCronStore } from '@store/cron';
import { DrizzleContext } from '@libs/context/DBContext';
import { vault, notificationSchedule } from '@libs/database/schema';
import { and, eq, lt } from 'drizzle-orm';
import { logger } from '@securevault/utils-native';

const CRON_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export const CronProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const db = useContext(DrizzleContext);
  const { lastCleanupRanAt, setLastCleanupRanAt } = useCronStore();

  useEffect(() => {
    if (!db) return;

    const runCleanup = async () => {
      const now = Date.now();

      // Check if 3 days have passed since the last run
      if (lastCleanupRanAt && now - lastCleanupRanAt < CRON_INTERVAL_MS) {
        return;
      }

      try {
        logger.info('Starting Local DB Cleanup Cron Job');

        // 1. Delete items marked as deleted (deletedAt is not null)
        // Safety: Only delete if deleted at least 7 days ago to ensure sync had a chance to finish
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        await db.delete(vault).where(lt(vault.deletedAt, sevenDaysAgo));

        // 2. Delete cancelled notifications
        await db.delete(notificationSchedule).where(eq(notificationSchedule.status, 'cancelled'));

        // 3. Delete corrupted data older than 3 days
        const threeDaysAgo = new Date(now - CRON_INTERVAL_MS);
        await db
          .delete(vault)
          .where(and(eq(vault.isCorrupted, true), lt(vault.corruptedAt, threeDaysAgo)));

        logger.info('Local DB Cleanup complete');
        setLastCleanupRanAt(now);
      } catch (error) {
        logger.error('Failed to run local DB cleanup', error);
      }
    };

    runCleanup();
    // We only want to run this once on mount/db-ready
  }, [db, lastCleanupRanAt, setLastCleanupRanAt]);

  return <>{children}</>;
};
