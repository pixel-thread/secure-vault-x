import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';

export class NotificationStoreManager {
  static async isEnabled(userId: string): Promise<boolean> {
    const val = await AsyncStorage.getItem(`${NOTIFICATIONS_ENABLED_KEY}_${userId}`);
    return val === null ? true : val === 'true'; // Default to true
  }

  static async setEnabled(userId: string, enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(
      `${NOTIFICATIONS_ENABLED_KEY}_${userId}`,
      enabled ? 'true' : 'false',
    );
  }
}
