import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import { logger } from '@securevault/utils-native';
import { useVaultService } from './useVaultService';
import { useSyncService } from './useSyncService';

type SaveDTO = {
  id: string;
  encryptedData: string;
  iv: string;
};

export type MutationMode = 'create' | 'edit';

export function usePasswordMutation(mode: MutationMode, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const vaultService = useVaultService();
  const syncService = useSyncService();

  return useMutation({
    mutationFn: async (data: SaveDTO) => {
      if (!vaultService) throw new Error('Vault Service not initialized');

      if (mode === 'edit') {
        logger.info('[usePasswordMutation] Updating vault item', { id: data.id });
        return await vaultService.updateVaultItem(data);
      } else {
        logger.info('[usePasswordMutation] Saving new vault item', { id: data.id });
        return await vaultService.saveVaultItem(data);
      }
    },
    onSuccess: () => {
      const message =
        mode === 'edit' ? 'Password updated successfully' : 'Password added successfully';
      logger.info(`[usePasswordMutation] ${message}`);
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      onSuccess?.();

      if (syncService) {
        logger.log('[usePasswordMutation] Triggering background sync');
        syncService
          .sync()
          .catch((err) =>
            logger.error('[usePasswordMutation] Background sync failed', { error: err })
          );
      }
    },
    onError: (error: any) => {
      logger.error('[usePasswordMutation] Failed to save secret', { error: error.message });
      toast.error('Failed to save secret', {
        description: error.message || 'Please try again.',
      });
    },
  });
}
