import { useContext } from 'react';
import { VaultServiceContext } from '@libs/context/VaultContext';

export const useVaultService = () => useContext(VaultServiceContext);
