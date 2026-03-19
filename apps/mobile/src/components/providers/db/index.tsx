import React, { useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import * as Updates from 'expo-updates';
import { useAuthStore } from '@store/auth';
import { logger } from '@securevault/utils-native';
import * as schema from '@libs/database/schema';
import migrations from '@libs/database/drizzle/migrations/migrations.js';
import { DrizzleContext } from '@libs/context/DBContext';
import { MigrationErrorScreen } from '@components/common/MigrationErrorScreen';
import { LoadingScreen } from '@components/common/LoadingScreen';

// 1. Initialize the connection OUTSIDE the component to prevent
// multiple connections/re-initialization during re-renders.
const expoDb = SQLite.openDatabaseSync('app.db');
const drizzleInstance = drizzle(expoDb, { schema });

export const DBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);

  // 2. useMigrations handles the progress state for us.
  const { success, error: migrationError } = useMigrations(drizzleInstance, migrations);

  useEffect(() => {
    // 3. Services are now initialized in VaultProvider
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
  return <DrizzleContext.Provider value={drizzleInstance}>{children}</DrizzleContext.Provider>;
};
