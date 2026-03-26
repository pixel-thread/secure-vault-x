import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CronState {
  lastCleanupRanAt: number | null;
  setLastCleanupRanAt: (timestamp: number) => void;
}

export const useCronStore = create<CronState>()(
  persist(
    (set) => ({
      lastCleanupRanAt: null,
      setLastCleanupRanAt: (timestamp: number) => set({ lastCleanupRanAt: timestamp }),
    }),
    {
      name: 'cron-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
