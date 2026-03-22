import React, { useMemo, useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { logger } from '@securevault/utils-native';
import { useAuthStore } from '@src/store/auth';
import { useDB } from '@hooks/useDB';
import { NotificationContext } from '@src/libs/context/NotificationContext';
import { NotificationScheduleService } from '@src/services/NotificationScheduleService';
import { NotificationStoreManager } from '@src/store/notification';
import { NotificationContextT } from '@src/types/notification';
import { VaultSecretT } from '@src/types/vault';
import { useVaultContext } from '@src/hooks/vault/useVaultContext';

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const db = useDB();
  const { user } = useAuthStore();
  const router = useRouter();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const { vaultItems } = useVaultContext();

  const service = useMemo(() => {
    if (!db) return null;
    return new NotificationScheduleService(db);
  }, [db]);

  // Load initial toggle state
  useEffect(() => {
    if (user?.id) {
      NotificationStoreManager.isEnabled(user.id).then(setIsNotificationsEnabled);
    }
  }, [user?.id]);

  // Deep-link listener
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const { item_id, item_type, action } = response.notification.request.content.data;

      if (action === 'open_item' && item_id) {
        logger.info('[NotificationProvider] Deep linking to secret', { item_id, item_type });
        // @ts-ignore - Dynamic path is safe here
        router.push({
          pathname: `/secret/${item_id}`,
          params: { id: String(item_id), type: String(item_type) },
        });
      }
    });

    return () => subscription.remove();
  }, [router]);

  // Reconcile on mount
  useEffect(() => {
    if (service && isNotificationsEnabled && vaultItems.length > 0) {
      service.reconcile(vaultItems);
    }
  }, [service, isNotificationsEnabled]); // Omit vaultItems from deps so it only runs on mount/auth/toggle

  const scheduleForItem = useCallback(
    async (item: VaultSecretT) => {
      if (!service || !isNotificationsEnabled) return;
      await service.scheduleForItem(item);
    },
    [service, isNotificationsEnabled]
  );

  const cancelForItem = useCallback(
    async (itemId: string) => {
      if (!service) return;
      await service.cancelForItem(itemId);
    },
    [service]
  );
  
  const scheduleTest = useCallback(
    async (item: VaultSecretT, delayMs: number) => {
      if (!service) return null;
      return await service.scheduleTest(item, delayMs);
    },
    [service]
  );

  const cancelAll = useCallback(async () => {
    if (!service) return;
    await service.cancelAll();
  }, [service]);

  const toggleNotifications = useCallback(
    async (enabled: boolean) => {
      if (!user?.id) return;
      
      await NotificationStoreManager.setEnabled(user.id, enabled);
      setIsNotificationsEnabled(enabled);

      if (!enabled) {
        await service?.cancelAll();
      } else {
        await service?.reconcile(vaultItems);
      }
    },
    [user?.id, service, vaultItems]
  );

  const value = useMemo<NotificationContextT>(
    () => ({
      scheduleForItem,
      cancelForItem,
      cancelAll,
      isNotificationsEnabled,
      toggleNotifications,
      scheduleTest,
    }),
    [scheduleForItem, cancelForItem, cancelAll, isNotificationsEnabled, toggleNotifications, scheduleTest]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
