import * as Updates from 'expo-updates';
import React, { createContext, useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { toast } from 'sonner-native';
import { logger } from '@securevault/utils-native';
import { OTAUpdateDialog } from '@components/common/OTAUpdateDialog';

interface UpdateContextType {
  isChecking: boolean;
  isDownloading: boolean;
  lastChecked: Date | null;
  checkForUpdates: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  const onFetchUpdateAsync = useCallback(async () => {
    if (isDownloading) return;

    try {
      setIsDownloading(true);
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        toast.wiggle('Downloading update...');
        await Updates.fetchUpdateAsync();
        setShowUpdateDialog(true);
      }
    } catch (error) {
      logger.error('Error fetching latest Expo update:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading]);

  const checkForUpdates = useCallback(
    async (silent = false) => {
      if (isChecking) return;

      // Only works in production/preview (EAS builds)
      if (__DEV__) {
        if (!silent) toast.info('Updates are disabled in development mode');
        return;
      }

      try {
        setIsChecking(true);
        const update = await Updates.checkForUpdateAsync();
        setLastChecked(new Date());

        if (update.isAvailable) {
          await onFetchUpdateAsync();
        } else {
          if (!silent) toast.success('Vibe check passed', { description: 'SecureVault is fresh.' });
        }
      } catch (error) {
        if (!silent) toast.error('Failed to check for updates');
        logger.error('Check for updates error:', error);
      } finally {
        setIsChecking(false);
      }
    },
    [isChecking, onFetchUpdateAsync]
  );

  const handleUpdate = async () => {
    try {
      setShowUpdateDialog(false);
      await Updates.reloadAsync();
    } catch (error) {
      logger.error('Failed to reload app for update:', error);
      toast.error('Failed to apply update. Please restart the app manually.');
    }
  };

  // Handle App Launch Check
  useEffect(() => {
    checkForUpdates(true);
  }, []);

  // Handle OTA Check on Foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkForUpdates(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkForUpdates]);

  return (
    <UpdateContext.Provider
      value={{
        isChecking,
        isDownloading,
        lastChecked,
        checkForUpdates: () => checkForUpdates(false),
      }}>
      {children}
      <OTAUpdateDialog
        isVisible={showUpdateDialog}
        onUpdate={handleUpdate}
        onCancel={() => setShowUpdateDialog(false)}
      />
    </UpdateContext.Provider>
  );
};
