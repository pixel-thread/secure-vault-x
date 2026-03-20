import { logger } from '@securevault/utils-native';
import { useVaultContext } from './vault/useVaultContext';
import { useState } from 'react';

type SaveDTO = {
  id: string;
  encryptedData: string;
  iv: string;
};

export type MutationMode = 'create' | 'edit';

/**
 * Create a mutate function for creating or updating a vault password entry and expose a combined pending flag.
 *
 * @param mode - "create" to add a new vault item or "edit" to update an existing one
 * @param onSuccess - Optional callback invoked after a successful save or update
 * @returns An object with:
 *  - `mutate` — a function that accepts a `SaveDTO` to perform the create or update operation
 *  - `isPending` — `true` when a local mutation is in progress or the context reports a save in progress, `false` otherwise
 */
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
