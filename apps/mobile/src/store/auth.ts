import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { generateMEK } from '@securevault/crypto';
import { logger } from '@securevault/utils';
import { UserT } from '@securevault/types';

interface AuthState {
  isAuthenticated: boolean;
  mek: string | null;
  jwtToken: string | null;
  user: UserT | null;
  isLoading: boolean;
  // Actions
  logout: () => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setAuth: (token: string, mek?: string) => void;
  setUser: (data: UserT) => Promise<void>;
  purgeLocalEnclave: () => Promise<void>;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: true,
  isAuthenticated: false,
  mek: null,
  jwtToken: null,
  user: null,
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setUser: async (data: UserT) => set({ user: data }),
  setAuth: (token: string, mek?: string) =>
    set({
      isAuthenticated: true,
      jwtToken: token,
      mek: mek || null,
    }),
  logout: () => set({ isAuthenticated: false, mek: null, user: null, jwtToken: null }),
  setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
  purgeLocalEnclave: async () => {
    // Physically destroy the DKEK backing the device trust.
    // This permanently bricks local Vault access on this device until re-registered.
    await SecureStore.deleteItemAsync('SV_DKEK');
    set({
      isAuthenticated: false,
      mek: null,
      jwtToken: null,
    });
  },
}));
