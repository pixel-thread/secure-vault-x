import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { UserT } from '@securevault/types';

interface AuthState {
  isAuthenticated: boolean;
  user: UserT | null;
  isLoading: boolean;
  hasMek: boolean;
  // Actions
  logout: () => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setUser: (data: UserT) => Promise<void>;
  purgeLocalEnclave: () => Promise<void>;
  setIsLoading: (isLoading: boolean) => void;
  setHasMek: (hasMek: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: true,
  isAuthenticated: false,
  user: null,
  hasMek: false,
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setUser: async (data: UserT) => set({ user: data }),
  setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
  setHasMek: (hasMek: boolean) => set({ hasMek }),
  logout: () => set({ isAuthenticated: false, user: null, isLoading: false, hasMek: false }),
  purgeLocalEnclave: async () => {
    // Physically destroy the DKEK backing the device trust.
    // This permanently bricks local Vault access on this device until re-registered.
    await SecureStore.deleteItemAsync('SV_DKEK');
    await SecureStore.deleteItemAsync('SV_MEK');
    await SecureStore.deleteItemAsync('SV_DEVICE_ID');
    await SecureStore.deleteItemAsync('SV_DEVICE_ID_RESERVE');
    await SecureStore.deleteItemAsync('SV_DEVICE_PRIVATE_KEY');
    set({ isAuthenticated: false, user: null, hasMek: false });
  },
}));
