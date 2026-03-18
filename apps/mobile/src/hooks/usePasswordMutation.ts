import { toast } from 'sonner-native';
import { logger } from '@securevault/utils-native';
import { useVaultContext } from './vault/useVaultContext';
import { useState } from 'react';

type SaveDTO = {
  id: string;
  encryptedData: string;
  iv: string;
};

export type MutationMode = 'create' | 'edit';

export function usePasswordMutation(mode: MutationMode, onSuccess?: () => void) {
  const { addVaultItem, updateVaultItem, isLoading, sync } = useVaultContext();
  const [isPending, setIsPending] = useState(false);

  const mutate = async (data: SaveDTO) => {
    setIsPending(true);
    try {
      if (mode === 'edit') {
        logger.info('[usePasswordMutation] Updating vault item', { id: data.id });
        await updateVaultItem(data);
      } else {
        logger.info('[usePasswordMutation] Saving new vault item', { id: data.id });
        await addVaultItem(data);
      }

      const message =
        mode === 'edit' ? 'Password updated successfully' : 'Password added successfully';
      logger.info(`[usePasswordMutation] ${message}`);
      // toast is already handled in VaultProvider, but we can add another one or rely on that
      onSuccess?.();

      logger.log('[usePasswordMutation] Triggering background sync');
      sync().catch((err) =>
        logger.error('[usePasswordMutation] Background sync failed', { error: err })
      );
    } catch (error: any) {
      logger.error('[usePasswordMutation] Failed to save secret', { error: error.message });
      // Error toast is also handled in VaultProvider
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending: isPending || isLoading.isSaving };
}
