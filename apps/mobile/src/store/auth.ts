import { create } from 'zustand';
import { UserT } from '@securevault/types';
import { DeviceStoreManager } from './device';
import { PasswordManager } from '@utils/native-bridges/PasswordManager';
import { logger } from '@securevault/utils-native';

interface AuthState {
  isAuthenticated: boolean;
  user: UserT | null;
  isLoading: boolean;
  hasMek: boolean;
  isHydrating: boolean;
  _hydrate: () => void;
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
  isHydrating: true,
  user: null,
  hasMek: false,
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setUser: async (data: UserT) => set({ user: data }),
  setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
  setHasMek: (hasMek: boolean) => set({ hasMek }),
  logout: () => {
    PasswordManager.clearVault().catch(() => {}); // Security: Wipe RAM bridge on logout
    set({ isAuthenticated: false, user: null, isLoading: false, hasMek: false });
  },
  purgeLocalEnclave: async () => {
    // Physically destroy the DKEK backing the device trust.
    // This permanently bricks local Vault access on this device until re-registered.
    await DeviceStoreManager.clearAll();
    // Security: Wipe RAM bridge on purge
    await PasswordManager.clearVault().catch((e: any) => {
      logger.error('Error clearing vault', e);
    });
    set({ isAuthenticated: false, user: null, hasMek: false });
  },
  _hydrate: () => {
    // TODO: hydrate and initialize user from storage into state
  },
}));
