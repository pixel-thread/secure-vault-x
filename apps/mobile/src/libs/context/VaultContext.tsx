import { createContext } from 'react';
import { VaultServiceT } from '@src/types/db';

export const VaultServiceContext = createContext<VaultServiceT | null>(null);
