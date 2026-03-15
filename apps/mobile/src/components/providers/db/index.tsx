import React, { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as Updates from 'expo-updates';
import { useAuthStore } from '@/src/store/auth';
import { logger } from '@securevault/utils-native';
import * as schema from '@/src/libs/database/schema';
import migrations from '@/src/libs/database/drizzle/migrations/migrations.js';
import { SyncServiceT, VaultServiceT } from '@/src/types/db';
import { DrizzleContext } from '@/src/libs/context/DBContext';
import { SyncServiceContext } from '@/src/libs/context/SyncContext';
import { VaultServiceContext } from '@/src/libs/context/VaultContext';
import { MigrationErrorScreen } from '../../common/MigrationErrorScreen';
import { LoadingScreen } from '../../common/LoadingScreen';

// 1. Initialize the connection OUTSIDE the component to prevent
// multiple connections/re-initialization during re-renders.
const expoDb = SQLite.openDatabaseSync('app.db');
const drizzleInstance = drizzle(expoDb, { schema });

export const DBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncService, setSyncService] = useState<SyncServiceT | null>(null);
  const [vaultService, setVaultService] = useState<VaultServiceT | null>(null);
  const user = useAuthStore((state) => state.user);

  // 2. useMigrations handles the progress state for us.
  const { success, error: migrationError } = useMigrations(drizzleInstance, migrations);

  useEffect(() => {
    // 3. Only initialize services once migrations are successful and user exists
    if (success && user?.id) {
      let isMounted = true;

      const initServices = async () => {
        const [{ SyncService }, { VaultService }] = await Promise.all([
          import('../../../services/SyncService'),
          import('../../../services/VaultService'),
        ]);

        if (isMounted) {
          setSyncService(new SyncService(drizzleInstance, user.id));
          setVaultService(new VaultService(drizzleInstance, user.id));
        }
      };

      initServices();

      return () => {
        isMounted = false;
      };
    } else {
      setSyncService(null);
      setVaultService(null);
    }
  }, [success, user?.id]);

  const handleReset = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      logger.error("Couldn't reload app:", e);
    }
  };

  // 4. Stylized Error State (matches ErrorBoundary)
  if (migrationError) {
    return <MigrationErrorScreen onReset={handleReset} message={migrationError.message} />;
  }

  // 5. Premium Loading State
  if (!success) {
    return <LoadingScreen message="Scanning local enclave and verifying data integrity" />;
  }

  // 6. Ready State
  return (
    <DrizzleContext.Provider value={drizzleInstance}>
      <SyncServiceContext.Provider value={syncService}>
        <VaultServiceContext.Provider value={vaultService}>{children}</VaultServiceContext.Provider>
      </SyncServiceContext.Provider>
    </DrizzleContext.Provider>
  );
};
