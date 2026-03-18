import { createContext } from 'react';
import { VaultContextT } from '@src/types/vault';

export const VaultContext = createContext<VaultContextT | null>(null);
