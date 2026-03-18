import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useVaultContext } from './vault/useVaultContext';
import * as Network from 'expo-network';
import { logger } from '@securevault/utils-native';

export const useSyncTrigger = () => {
  const { sync } = useVaultContext();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Trigger sync on mount
    sync();

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground, triggering sync');
        sync();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [sync]);

  // Network listener
  useEffect(() => {
    const checkNetAndSync = async () => {
      const netInfo = await Network.getNetworkStateAsync();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        logger.log('Network is up, triggering sync', {
          isConnected: netInfo.isConnected,
          isInternetReachable: netInfo.isInternetReachable,
        });
        sync();
      }
    };

    // Note: In a real app we'd use NetInfo to subscribe,
    // but for now we rely on foregrounding or periodic checks.
    checkNetAndSync();
  }, [sync]);
};
