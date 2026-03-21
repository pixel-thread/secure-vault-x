import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  isHydrating: boolean;
  _hydrate: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isHydrating: false,
      isDarkMode: false, // Default to dark as requested earlier
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setTheme: (isDark: boolean) => set({ isDarkMode: isDark }),
      _hydrate: () => {
        set({ isHydrating: true });
        const isDark = get().isDarkMode;
        console.log('Hydrating theme', { isDark });
        set({ isDarkMode: isDark, isHydrating: false });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
