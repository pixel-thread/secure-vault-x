import { VaultContext } from '@src/libs/context/VaultContext';
import { useContext } from 'react';

export function useVaultContext() {
  const context = useContext(VaultContext);

  if (!context) {
    throw new Error('useVaultContext must be used within a VaultProvider');
  }

  return context;
}
