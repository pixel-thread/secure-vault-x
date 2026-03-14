import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-[#09090b]">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
          <View className="flex-1 items-center justify-center">
            <View className="mb-8 h-24 w-24 items-center justify-center rounded-3xl bg-red-500/10 shadow-xl shadow-red-500/10 dark:bg-red-500/20">
              <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
            </View>

            <Text className="mb-2 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Database Error
            </Text>

            <Text className="mb-8 text-center text-lg text-zinc-500 dark:text-zinc-400">
              We encountered an error while initializing your local vault database.
            </Text>

            <View className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
              <Text className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
                Technical Details
              </Text>
              <Text className="font-mono text-xs text-red-600 dark:text-red-400">
                {migrationError.message}
              </Text>
            </View>

            <View className="mt-12 w-full">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleReset}
                className="w-full items-center rounded-2xl bg-zinc-900 py-4 shadow-lg active:scale-[0.98] dark:bg-white">
                <Text className="text-lg font-bold text-white dark:text-zinc-900">Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 5. Premium Loading State
  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-8 dark:bg-[#09090b]">
        <View className="mb-8 h-24 w-24 items-center justify-center rounded-3xl bg-emerald-500/10 shadow-xl shadow-emerald-500/5 dark:bg-emerald-500/20">
          <Ionicons
            name="shield-checkmark-outline"
            size={56}
            color="#10b981"
            className="animate-pulse"
          />
        </View>

        <Text className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          SecureVault <Text className="text-emerald-500">X</Text>
        </Text>

        <View className="flex-row items-center gap-x-2">
          <ActivityIndicator size="small" color="#10b981" />
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Preparing Secure Vault...
          </Text>
        </View>

        <View className="absolute bottom-12 px-8">
          <Text className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            Scanning local enclave and verifying data integrity
          </Text>
        </View>
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
