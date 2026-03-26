import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { DrizzleContext } from '@src/libs/context/DBContext';
import * as schema from '@src/libs/database/schema';
import { desc } from 'drizzle-orm';
import { Container } from '@securevault/ui-native';
import Header from '@src/components/common/Header';
import { StackHeader } from '@src/components/common/StackHeader';

/**
 * DatabaseViewScreen Component
 * A developer-only screen to inspect the raw contents of the SQLite vault table.
 */
export function DatabaseViewScreen() {
  const db = useContext(DrizzleContext);
  const [data, setData] = useState<(typeof schema.vault.$inferSelect)[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!db) return;
    try {
      // Query all records from the vault table, ordered by most recently updated
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

  const renderItem = ({ item }: { item: typeof schema.vault.$inferSelect }) => {
    const isDeleted = !!item.deletedAt;
    const isCorrupted = !!item.isCorrupted;

    return (
      <View
        className={`mb-4 rounded-3xl border ${
          isDeleted
            ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/30 dark:bg-rose-950/10'
            : 'border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/40'
        } p-6 shadow-sm`}
      >
        <View className="mb-4 flex-row items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <Text className="font-mono text-[10px] uppercase tracking-tight text-zinc-500">
            {item.id.substring(0, 16)}...
          </Text>
          <View className="flex-row gap-2">
            {isDeleted && (
              <View className="rounded-full bg-rose-500/10 px-2.5 py-1">
                <Text className="text-[10px] font-bold uppercase text-rose-500">Trash</Text>
              </View>
            )}
            {isCorrupted && (
              <View className="rounded-full bg-amber-500/10 px-2.5 py-1">
                <Text className="text-[10px] font-bold uppercase text-amber-500">Broken</Text>
              </View>
            )}
            {!isDeleted && !isCorrupted && (
              <View className="rounded-full bg-emerald-500/10 px-2.5 py-1">
                <Text className="text-[10px] font-bold uppercase text-emerald-500">Live</Text>
              </View>
            )}
          </View>
        </View>

        <View className="gap-4">
          <View>
            <Text className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Encrypted Blob
            </Text>
            <View className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-950/50">
              <Text
                className="font-mono text-[11px] leading-4 text-zinc-600 dark:text-zinc-400"
                numberOfLines={3}
              >
                {item.encryptedData}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                IV
              </Text>
              <Text className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                {item.iv || 'None'}
              </Text>
            </View>
            <View className="w-16">
              <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Ver
              </Text>
              <Text className="text-xs font-bold text-emerald-500">v{item.version}</Text>
            </View>
          </View>

          <View className="mt-1 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Stash Time
              </Text>
              <Text className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                {new Date(item.updatedAt).toLocaleTimeString()}
              </Text>
            </View>
            <View>
              <Text className="mb-1 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Owner
              </Text>
              <Text className="text-right font-mono text-[10px] text-zinc-500">
                {item.userId.substring(0, 8)}...
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Container>
      <Header title="The Matrix" subtitle="Raw db inspector" />
      <StackHeader title="The Matrix" subtitle="Raw db inspector" />

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-6 pb-24"
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-32">
            <Text className="text-lg font-bold text-zinc-400">The stash is empty</Text>
          </View>
        }
      />
    </Container>
  );
}
