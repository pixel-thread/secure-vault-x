import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { UserT } from '@securevault/types';

interface AuthState {
  isAuthenticated: boolean;
  user: UserT | null;
  isLoading: boolean;
  // Actions
  logout: () => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setUser: (data: UserT) => Promise<void>;
  purgeLocalEnclave: () => Promise<void>;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setUser: async (data: UserT) => set({ user: data }),
  setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
  logout: () => set({ isAuthenticated: false, user: null, isLoading: false }),
  purgeLocalEnclave: async () => {
    // Physically destroy the DKEK backing the device trust.
    // This permanently bricks local Vault access on this device until re-registered.
    await SecureStore.deleteItemAsync('SV_DKEK');
    set({ isAuthenticated: false, user: null });
  },
}));
