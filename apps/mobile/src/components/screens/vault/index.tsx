import { Ionicons } from '@expo/vector-icons';
import { Container } from '@securevault/ui-native';
import { logger } from '@securevault/utils-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { toast } from 'sonner-native';
import Header from '@components/common/Header';
import { Ternary } from '@src/components/common/Ternary';
import { useVaultContext } from '@hooks/vault/useVaultContext';
import { VaultSecretT } from '@src/types/vault';
import { seedVaultItems, clearVaultItems } from '@utils/vault/dev';
import { VaultEmpty } from './VaultEmpty';
import { VaultItem } from './VaultItem';

/**
 * Renders the home vault screen with a list of all secured secrets.
 */
export default function VaultScreen() {
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  const {
    vaultItems: vaults,
    isLoading: contextLoading,
    addVaultItem,
    deleteVaultItem,
    sync,
    fetchNextPage,
  } = useVaultContext();

  // --- HANDLERS ---

  const onManualSync = useCallback(async () => {
    if (contextLoading.isSyncing) return;
    try {
      await sync();
    } catch (error) {
      logger.error('[VaultScreen] Sync failed', { error });
    }
  }, [sync, contextLoading.isSyncing]);

  const onSeedDevItems = useCallback(async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      await seedVaultItems(addVaultItem);
      toast.success('Seeded 100 items... manifesting success!');
      await sync();
    } catch (error: any) {
      logger.error('[VaultScreen] Seed failed', { error });
      toast.error('Seed failed, major L.');
    } finally {
      setIsSeeding(false);
    }
  }, [addVaultItem, isSeeding, sync]);

  const onClearDevItems = useCallback(async () => {
    if (vaults.length === 0) return;

    Alert.alert('Clear everything?', `Delete all ${vaults.length} items? This is a total reset.`, [
      { text: 'Never mind', style: 'cancel' },
      {
        text: 'Yeet them',
        style: 'destructive',
        onPress: async () => {
          setIsSeeding(true);
          try {
            await clearVaultItems(vaults, deleteVaultItem).finally(() => sync());
          } finally {
            setIsSeeding(false);
          }
        },
      },
    ]);
  }, [vaults, deleteVaultItem, sync]);

  const onSelectItem = useCallback(
    (item: VaultSecretT) => router.push(`/secret/${item.id}`),
    [router]
  );

  const onOpenAdd = useCallback(() => router.push('/secret'), [router]);

  // --- RENDER ---

  return (
    <Container>
      <Header
        title="My Stash"
        subtitle="Safe as houses"
        rightElement={
          <View className="flex-row">
            {isDev && (
              <>
                <TouchableOpacity
                  className="mr-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/80"
                  onPress={onSeedDevItems}
                  disabled={isSeeding}>
                  {isSeeding ? (
                    <ActivityIndicator size="small" color="#f59e0b" />
                  ) : (
                    <Ionicons name="flask" size={24} color="#f59e0b" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="mr-3 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/80"
                  onPress={() => router.push('/dev/database')}
                  disabled={isSeeding}>
                  {isSeeding ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Ionicons name="server-outline" size={24} color="#ef4444" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  className="mr-3 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/80"
                  onPress={onClearDevItems}
                  disabled={isSeeding}>
                  {isSeeding ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />

      <Ternary
        condition={vaults.length > 0}
        ifTrue={
          <FlashList
            data={vaults ?? []}
            refreshing={false}
            onRefresh={onManualSync}
            onEndReached={fetchNextPage}
            onEndReachedThreshold={0.5}
            // @ts-ignore - estimatedItemSize type check fails in this React Native version
            estimatedItemSize={80}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-6 py-6 pb-32"
            className="flex-1"
            ListEmptyComponent={<VaultEmpty />}
            renderItem={({ item }) => <VaultItem item={item} onSelectItem={onSelectItem} />}
          />
        }
        ifFalse={<VaultEmpty />}
      />

      <TouchableOpacity
        className="absolute bottom-8 right-8 h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-2xl shadow-emerald-500/40 active:scale-95"
        onPress={onOpenAdd}>
        <Ionicons name="add" size={32} color="#022c22" />
      </TouchableOpacity>
    </Container>
  );
}
