import React, { useMemo, useCallback } from 'react';
import { logger } from '@securevault/utils-native';
import { VaultContext } from '@src/libs/context/VaultContext';
import { VaultService } from '@src/services/VaultService';
import { SyncService } from '@src/services/SyncService';
import { VaultContextT, VaultSecretT } from '@src/types/vault';
import { useMutation, useInfiniteQuery, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import { useDB } from '@hooks/useDB';
import { useAuthStore } from '@src/store/auth';
import { LoadingScreen } from '@src/components/common/LoadingScreen';

export const VaultProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const db = useDB();
  const { user, isAuthenticated } = useAuthStore();

  /**
   * -------------------------------
   * 1. Services Initialization
   * -------------------------------
   */
  const vaultService = useMemo(() => {
    if (!db || !user?.id) return null;
    return new VaultService(db, user.id);
  }, [db, user?.id]);

  const syncService = useMemo(() => {
    if (!db || !user?.id) return null;
    return new SyncService(db, user.id);
  }, [db, user?.id]);

  /**
   * -------------------------------
   * 2. Ready State (CRITICAL)
   * -------------------------------
   */
  const isReady = !!db && !!user?.id && !!vaultService && !!syncService;

  /**
   * Wait until services are ready
   */
  const waitForReady = useCallback(async () => {
    if (isReady) return;

    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!!db && !!user?.id) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }, [isReady, db, user?.id]);

  /**
   * -------------------------------
   * 3. Fetch Vault Items
   * -------------------------------
   */
  const {
    data,
    isLoading: isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['vault', user?.id],
    queryFn: async ({ pageParam = 0 }: { pageParam: unknown }) => {
      if (!vaultService) return [];
      return await vaultService.getVaultItems({ limit: 20, offset: pageParam as number });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: VaultSecretT[], allPages: VaultSecretT[][]) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    enabled: isReady,
  });

  const vaultItems = useMemo(() => data?.pages.flat() ?? [], [data]);

  /**
   * -------------------------------
   * 4. Sync Mutation
   * -------------------------------
   */
  const { mutate: syncMutate, isPending: isSyncing } = useMutation({
    mutationFn: async () => {
      await waitForReady();
      if (!syncService) return;

      return await syncService.sync();
    },
    onSuccess: () => {
      if (!user?.id) return;

      queryClient.invalidateQueries({ queryKey: ['vault', user.id] });

      logger.info('Sync successful', {
        userId: !!user.id,
        timeStamp: Date.now(),
      });
    },
    onError: (err: Error) => {
      toast.error('Sync failed', { description: err.message });
    },
  });

  /**
   * -------------------------------
   * 5. Delete Item
   * -------------------------------
   */
  const { mutateAsync: deleteItem, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      await waitForReady();
      if (!vaultService) throw new Error('Service not ready');

      return await vaultService.deleteVaultItem(id);
    },
    onSuccess: async () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['vault', user.id] });
      }

      // Background sync (safe)
      try {
        toast.success('Deleted successfully');
        syncMutate();
      } catch (e) {
        logger.error('Post-delete sync failed', { error: e });
      }
    },
    onError: (err: Error) => {
      toast.error('Delete failed', { description: err.message });
    },
  });

  /**
   * -------------------------------
   * 6. Save / Update Item
   * -------------------------------
   */
  const { mutateAsync: saveItem, isPending: isSaving } = useMutation({
    mutationFn: async (data: unknown) => {
      await waitForReady();
      if (!vaultService) throw new Error('Service not ready');

      return await vaultService.saveVaultItem(data);
    },
    onSuccess: async () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['vault', user.id] });
      }

      // Background sync
      try {
        syncMutate();
      } catch (e) {
        logger.error('Post-save sync failed', { error: e });
      }
      toast.success('Vault updated');
    },
    onError: (err: Error) => {
      toast.error('Save failed', { description: err.message });
    },
  });

  const { mutateAsync: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: async (data: unknown) => {
      if (!vaultService) throw new Error('Service not ready');
      return await vaultService.updateVaultItem(data);
    },
    onSuccess: () => {
      toast.success('Vault updated');
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      // Trigger background sync
      syncMutate();
    },
    onError: (err: Error) => {
      toast.error('Save failed', { description: err.message });
    },
  });

  /**
   * -------------------------------
   * 7. Context Methods
   * -------------------------------
   */
  const getVaultItems = useCallback(
    async (params?: { limit?: number; offset?: number }) => {
      if (!vaultService) return [];
      return vaultService.getVaultItems(params);
    },
    [vaultService]
  );

  const removeVaultItem = useCallback(
    async (id: string) => {
      await deleteItem(id);
    },
    [deleteItem]
  );

  const addVaultItem = useCallback(
    async (input: unknown) => {
      await saveItem(input);
    },
    [saveItem]
  );

  const updateVaultItem = useCallback(
    async (input: unknown) => {
      await updateItem(input);
    },
    [updateItem]
  );

  const getVaultItem = useCallback(
    async (id: string) => {
      return vaultItems.find((i: VaultSecretT) => i.id === id) || null;
    },
    [vaultItems]
  );

  const sync = useCallback(async () => {
    syncMutate();
  }, [syncMutate]);

  /**
   * -------------------------------
   * 8. Context Value
   * -------------------------------
   */
  const value = useMemo<VaultContextT>(
    () => ({
      getVaultItems,
      deleteVaultItem: removeVaultItem,
      addVaultItem,
      updateVaultItem,
      getVaultItem,
      sync,
      vaultItems,
      isVaultReady: isReady,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading: {
        isFetching,
        isSaving,
        isDeleting,
        isSyncing,
        isPending: isFetching || isSaving || isDeleting || isSyncing || isUpdating,
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
      isReady,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isFetching,
      isSaving,
      isDeleting,
      isSyncing,
      isUpdating,
    ]
  );

  /**
   * -------------------------------
   * 9. Render Guard (OPTIONAL but recommended)
   * -------------------------------
   */
  if (!isReady && isAuthenticated) {
    return <LoadingScreen message="Vault is loading..." />; // or splash screen
  }

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};
