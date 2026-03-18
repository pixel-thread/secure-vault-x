import React, { useMemo, useCallback } from 'react';
import { logger } from '@securevault/utils-native';
import { VaultContext } from '@src/libs/context/VaultContext';
import { VaultService } from '@src/services/VaultService';
import { SyncService } from '@src/services/SyncService';
import { VaultContextT } from '@src/types/vault';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import { useDB } from '@hooks/useDB';
import { useAuthStore } from '@src/store/auth';

export const VaultProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const db = useDB();
  const { user } = useAuthStore();

  // 1. Initialize Service Instances
  const vaultService = useMemo(() => {
    if (!db || !user?.id) return null;
    return new VaultService(db, user.id);
  }, [db, user?.id]);

  const syncService = useMemo(() => {
    if (!db || !user?.id) return null;
    return new SyncService(db, user.id);
  }, [db, user?.id]);

  const { data: vaultItems = [], isLoading: isFetching } = useQuery({
    queryKey: ['vault', user?.id],
    queryFn: async () => {
      if (!vaultService) return [];
      return await vaultService.getVaultItems();
    },
    enabled: !!vaultService,
  });

  const { mutateAsync: syncMutate, isPending: isSyncing } = useMutation({
    mutationFn: async () => {
      if (!syncService) {
        logger.warn('[VaultProvider] Sync skipped: Service not ready');
        return;
      }
      return await syncService.sync();
    },
    onSuccess: (_) => {
      // Re-check service availability to decide on UI feedback
      if (!syncService) return;
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      logger.info('Sync successful', {
        userId: !!user?.id,
        timeStamp: Date.now(),
      });
    },
    onError: (err: any) => {
      // Don't toast for "not ready" as it's handled in mutationFn
      if (err.message === 'Sync service not ready') return;
      toast.error('Sync failed', { description: err.message });
    },
  });

  const { mutateAsync: deleteItem, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      if (!vaultService) throw new Error('Service not ready');
      return await vaultService.deleteVaultItem(id);
    },
    onSuccess: () => {
      toast.success('Deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      // Trigger background sync
      syncMutate().catch((e) => logger.error('Post-delete sync failed', { error: e }));
    },
    onError: (err: any) => {
      toast.error('Delete failed', { description: err.message });
    },
  });

  const { mutateAsync: saveItem, isPending: isSaving } = useMutation({
    mutationFn: async (data: any) => {
      if (!vaultService) throw new Error('Service not ready');
      return await vaultService.saveVaultItem(data);
    },
    onSuccess: () => {
      toast.success('Vault updated');
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      // Trigger background sync
      syncMutate().catch((e) => logger.error('Post-save sync failed', { error: e }));
    },
    onError: (err: any) => {
      toast.error('Save failed', { description: err.message });
    },
  });

  // --- Context Methods (Stable) ---
  const getVaultItems = useCallback(async () => vaultItems, [vaultItems]);

  const removeVaultItem = useCallback(
    async (id: string) => {
      await deleteItem(id);
    },
    [deleteItem]
  );

  const addVaultItem = useCallback(
    async (input: any) => {
      await saveItem(input);
    },
    [saveItem]
  );

  const updateVaultItem = useCallback(
    async (input: any) => {
      await saveItem(input);
    },
    [saveItem]
  );

  const getVaultItem = useCallback(
    async (id: string) => {
      return vaultItems.find((i) => i.id === id) || null;
    },
    [vaultItems]
  );

  const sync = useCallback(async () => {
    await syncMutate();
  }, [syncMutate]);

  // --- Context Value (Memoized) ---
  const value = useMemo<VaultContextT>(
    () => ({
      getVaultItems,
      deleteVaultItem: removeVaultItem,
      addVaultItem,
      updateVaultItem,
      getVaultItem,
      sync,
      vaultItems,
      isLoading: {
        isFetching,
        isSaving,
        isDeleting,
        isSyncing,
        isPending: isFetching || isSaving || isDeleting || isSyncing,
      },
    }),
    [
      getVaultItems,
      removeVaultItem,
      addVaultItem,
      updateVaultItem,
      getVaultItem,
      sync,
      vaultItems,
      isFetching,
      isSaving,
      isDeleting,
      isSyncing,
    ]
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};
