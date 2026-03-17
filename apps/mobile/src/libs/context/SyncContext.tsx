import { createContext } from 'react';
import { SyncServiceT } from '@src/types/db';

export const SyncServiceContext = createContext<SyncServiceT | null>(null);
