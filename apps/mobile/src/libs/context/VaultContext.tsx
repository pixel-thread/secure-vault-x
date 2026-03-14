import { createContext } from 'react';
import { VaultServiceT } from '../../types/db';

export const VaultServiceContext = createContext<VaultServiceT | null>(null);
