import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useAuthStore } from '@/src/store/auth';
import * as schema from '@/src/libs/database/schema';
import migrations from '@/src/libs/database/drizzle/migrations/migrations.js';
import { SyncServiceT, VaultServiceT } from '@/src/types/db';
import { DrizzleContext } from '@/src/libs/context/DBContext';
import { SyncServiceContext } from '@/src/libs/context/SyncContext';
import { VaultServiceContext } from '@/src/libs/context/VaultContext';

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

  // 4. Error State
  if (migrationError) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4 dark:bg-[#09090b]">
        <Text className="mb-2 text-center text-lg font-bold text-red-500">
          Database Initialization Error
        </Text>
        <Text className="text-center text-gray-500">{migrationError.message}</Text>
      </View>
    );
  }

  // 5. Loading State (Shows while migrations are running)
  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#09090b]">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 animate-pulse text-sm font-medium text-gray-500">
          Initializing Vault...
        </Text>
      </View>
    );
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
