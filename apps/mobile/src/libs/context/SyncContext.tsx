import { createContext } from 'react';
import { SyncServiceT } from '../../types/db';

export const SyncServiceContext = createContext<SyncServiceT | null>(null);
