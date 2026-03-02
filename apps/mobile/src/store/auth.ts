import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { generateMEK } from '@securevault/crypto';

interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  jwtToken: string | null;
  mek: string | null;

  // Actions
  setAuth: (email: string, token: string) => Promise<void>;
  logout: () => void;
  purgeLocalEnclave: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  email: null,
  jwtToken: null,
  mek: null,

  setAuth: async (email, token) => {
    // 1. Native Biometric Prompt before accessing Keystore
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && isEnrolled) {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SecureVault X',
        fallbackLabel: 'Use Passcode',
      });
      if (!authResult.success) {
        throw new Error('Device authentication failed');
      }
    }

    // 2. Derive or Load DKEK (Device Key Encryption Key) from Secure Enclave
    let dkek = await SecureStore.getItemAsync('SV_DKEK', { requireAuthentication: true });
    if (!dkek) {
      dkek = await generateMEK(); // Use Crypto lib to generate secure key
      await SecureStore.setItemAsync('SV_DKEK', dkek, { requireAuthentication: true });
      console.log('New DKEK generated and bound to Secure Enclave');
    }

    // 3. For the purposes of this demo, we generate a mock MEK loaded in memory representing
    // the decrypted MEK pulled from the server's encrypted envelope payload using the DKEK.
    const mek = await generateMEK();

    // 4. Set reactive state
    set({
      isAuthenticated: true,
      email,
      jwtToken: token,
      mek,
    });
  },

  logout: () => {
    // Wipe sensitive cryptographic keys from JS memory immediately
    set({
      isAuthenticated: false,
      email: null,
      jwtToken: null,
      mek: null,
    });
  },

  purgeLocalEnclave: async () => {
    // Physically destroy the DKEK backing the device trust.
    // This permanently bricks local Vault access on this device until re-registered.
    await SecureStore.deleteItemAsync('SV_DKEK');
    set({
      isAuthenticated: false,
      email: null,
      jwtToken: null,
      mek: null,
    });
  },
}));
