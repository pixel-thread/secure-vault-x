import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSyncService } from './useSyncService';
import * as Network from 'expo-network';

export const useSyncTrigger = () => {
  const syncService = useSyncService();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!syncService) return;

    // Trigger sync on mount
    syncService.sync();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground, triggering sync');
        syncService.sync();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [syncService]);

  // Network listener
  useEffect(() => {
    if (!syncService) return;

    const checkNetAndSync = async () => {
      const netInfo = await Network.getNetworkStateAsync();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        console.log('Network is up, triggering sync');
        syncService.sync();
      }
    };

    // Note: In a real app we'd use NetInfo to subscribe,
    // but for now we rely on foregrounding or periodic checks.
    checkNetAndSync();
  }, [syncService]);
};
