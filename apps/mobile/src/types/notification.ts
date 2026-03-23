import { VaultSecretT } from '@src/types/vault';

export type NotificationContextT = {
  scheduleForItem: (item: VaultSecretT) => Promise<void>;
  cancelForItem: (itemId: string) => Promise<void>;
  cancelAll: () => Promise<void>;
  isNotificationsEnabled: boolean;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  scheduleTest: (item: VaultSecretT, delayMs: number) => Promise<string | null>;
};
