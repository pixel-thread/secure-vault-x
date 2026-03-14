import AsyncStorage from '@react-native-async-storage/async-storage';

type LastSyncAtProps = {
  userId: string;
};

interface SetSyncAtProps extends LastSyncAtProps {
  time: number;
}

const LAST_SYNCED_KEY = 'last_synced_at';

export class SyncStoreManager {
  static async lastSyncAt({ userId }: LastSyncAtProps): Promise<string | null> {
    return await AsyncStorage.getItem(`${LAST_SYNCED_KEY}_${userId}`);
  }
  static async setLastSyncAt({ userId, time }: SetSyncAtProps) {
    await AsyncStorage.setItem(`${LAST_SYNCED_KEY}_${userId}`, time.toString());
  }
}
