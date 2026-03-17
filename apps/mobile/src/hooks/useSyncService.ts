import { useContext } from 'react';
import { SyncServiceContext } from '@libs/context/SyncContext';

export const useSyncService = () => useContext(SyncServiceContext);
