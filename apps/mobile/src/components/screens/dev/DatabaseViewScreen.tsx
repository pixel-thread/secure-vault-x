import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, useColorScheme, RefreshControl } from 'react-native';
import { DrizzleContext } from '@src/libs/context/DBContext';
import * as schema from '@src/libs/database/schema';
import { desc } from 'drizzle-orm';
import { Stack } from 'expo-router';

/**
 * DatabaseViewScreen Component
 * A developer-only screen to inspect the raw contents of the SQLite vault table.
 */
export function DatabaseViewScreen() {
  const db = useContext(DrizzleContext);
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!db) return;
    try {
      // Query all records from the vault table, ordered by most recently updated
      // We include deleted items to see the raw state
      const result = await db.select().from(schema.vault).orderBy(desc(schema.vault.updatedAt));
      setData(result);
    } catch (error) {
      console.error('[DatabaseView] Failed to fetch raw db data', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [db]);

  useEffect(() => {
    fetchData();
  }, [db]);

  const renderItem = ({ item }: { item: any }) => {
    const isDeleted = !!item.deletedAt;
    const isCorrupted = !!item.isCorrupted;

    return (
      <View
        className={`mb-4 rounded-3xl border ${isDeleted ? 'border-red-100 bg-red-50/30' : 'border-zinc-200 bg-white'} p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50`}>
        <View className="mb-3 flex-row items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
          <Text className="font-mono text-[10px] text-zinc-500">{item.id}</Text>
          <View className="flex-row gap-2">
            {isDeleted && (
              <View className="rounded-full bg-red-500/10 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-red-500 uppercase">Deleted</Text>
              </View>
            )}
            {isCorrupted && (
              <View className="rounded-full bg-amber-500/10 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-amber-500 uppercase">Corrupted</Text>
              </View>
            )}
            {!isDeleted && !isCorrupted && (
              <View className="rounded-full bg-emerald-500/10 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-emerald-500 uppercase">Active</Text>
              </View>
            )}
          </View>
        </View>

        <View className="gap-3">
          <View>
            <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Encrypted Data
            </Text>
            <Text
              className="font-mono text-[11px] leading-4 text-zinc-700 dark:text-zinc-300"
              numberOfLines={3}>
              {item.encryptedData}
            </Text>
          </View>

          <View className="flex-row gap-6">
            <View className="flex-1">
              <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                IV
              </Text>
              <Text className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                {item.iv || 'N/A'}
              </Text>
            </View>
            <View className="w-16">
              <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Ver
              </Text>
              <Text className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {item.version}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Timeline
              </Text>
              <View className="flex-row flex-wrap gap-x-3 gap-y-1">
                <Text className="text-[10px] text-zinc-500">
                  Upd: <Text className="text-zinc-700 dark:text-zinc-300">{new Date(item.updatedAt).toLocaleTimeString()}</Text>
                </Text>
                {isDeleted && (
                  <Text className="text-[10px] text-red-400">
                    Del: <Text className="text-red-600">{new Date(item.deletedAt).toLocaleTimeString()}</Text>
                  </Text>
                )}
              </View>
            </View>
            <View>
              <Text className="mb-1 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Owner (Partial)
              </Text>
              <Text className="text-right text-[10px] font-medium text-zinc-500">
                {item.userId.substring(0, 10)}...
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-[#000000]">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Raw DB Inspector',
          headerStyle: { backgroundColor: isDarkMode ? '#09090b' : '#fff' },
          headerTintColor: isDarkMode ? '#fff' : '#000',
          headerTitleStyle: { color: isDarkMode ? '#fff' : '#000' },
          headerBackTitle: 'Vault',
        }}
      />

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-6 pb-20"
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-24">
            <Text className="text-zinc-500">No raw records found</Text>
          </View>
        }
      />
    </View>
  );
}
