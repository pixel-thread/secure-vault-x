import { VaultContext } from '@src/libs/context/VaultContext';
import { useContext } from 'react';

/**
 * Accesses the current VaultContext value from React context within a VaultProvider.
 *
 * @returns The current VaultContext value.
 * @throws Error if the hook is called outside of a VaultProvider.
 */
export function useVaultContext() {
  const context = useContext(VaultContext);

  if (!context) {
    throw new Error('useVaultContext must be used within a VaultProvider');
  }

  return context;
}
