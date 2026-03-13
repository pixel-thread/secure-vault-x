import { View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../common/Header';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/auth';
import { useQuery } from '@tanstack/react-query';
import { VaultItem } from './VaultItem';
import { VaultItemDialog } from './VaultItemDialog';
import { AddSecretDialog } from './AddSecretDialog';
import { VaultEmpty } from './VaultEmpty';
import { MekSetup } from './MekSetup';
import { VaultSecretT } from '@/src/types/vault';
import { useVaultService } from '@/src/hooks/useVaultService';
import { useSyncService } from '@/src/hooks/useSyncService';

export default function VaultScreen() {
  // --- UI State Management ---
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<VaultSecretT | null>(null);

  const vaultService = useVaultService();
  const syncService = useSyncService();

  const {
    data: vaults = [],
    isLoading,
    isFetching,
    refetch: triggerSync,
  } = useQuery<VaultSecretT[]>({
    queryKey: ['vault'],
    queryFn: async (): Promise<VaultSecretT[]> => {
      if (!vaultService) return [];
      return await vaultService.getVaultItems();
    },
    enabled: isAuthenticated && hasMek && !!vaultService,
    refetchOnMount: true,
    networkMode: 'offlineFirst',
  });

  // Consolidate loading state for UI feedback
  const isSyncingOrLoading = isLoading || isFetching;

  const onManualSync = async () => {
    if (syncService) {
      await syncService.sync();
      triggerSync(); // Refresh local list after sync
    }
  };

  if (!hasMek) {
    return <MekSetup />;
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#09090b]">
      {/* Page Header */}
      <Header
        title="My Vault"
        subtitle="End-to-End Encrypted"
        rightElement={
          <TouchableOpacity
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 shadow-md active:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/80 dark:active:bg-zinc-800"
            onPress={onManualSync}>
            {loading ? (
              <ActivityIndicator color="#10b981" />
            ) : (
              <Ionicons name="sync" size={24} color="#10b981" />
            )}
          </TouchableOpacity>
        }
      />

      {/* Main List of Secrets */}
      <FlatList
        data={vaults}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 py-6 pb-32"
        className="flex-1"
        ListEmptyComponent={<VaultEmpty />}
        renderItem={({ item }) => <VaultItem item={item} onSelectItem={onSelectItem} />}
      />

      {/* Floating Action Button for Adding Secrets */}
      <TouchableOpacity
        className="absolute bottom-8 right-8 h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-2xl shadow-emerald-500/40 active:scale-95"
        onPress={onOpenAdd}>
        <Ionicons name="add" size={32} color="#022c22" />
      </TouchableOpacity>

      {/* Dialogs */}
      <AddSecretDialog
        open={addModalVisible}
        onValueChange={(isOpen) => {
          if (!isOpen) logger.log('[VaultScreen] Add secret dialog closed');
          setAddModalVisible(isOpen);
        }}
      />

      {selectedSecret && (
        <VaultItemDialog
          onValueChange={onCloseDetail}
          open={detailModalVisible}
          item={selectedSecret}
        />
      )}
    </View>
  );
}
