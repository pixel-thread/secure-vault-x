import { create } from "zustand";
import { generateMEK } from "@securevault/crypto";

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
    // 1. WebAuthn or Browser local unlock simulation could go here
    // For demo purposes on the web UI, we proceed directly.

    // 2. Derive or Load DKEK (Device Key Encryption Key) from localStorage
    let dkek = null;
    if (typeof window !== "undefined") {
      dkek = localStorage.getItem("SV_DKEK");
      if (!dkek) {
        dkek = await generateMEK(); // Use Crypto lib to generate secure key
        localStorage.setItem("SV_DKEK", dkek);
        console.log("New DKEK generated and bound to Browser LocalStorage");
      }
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("SV_DKEK");
    }

    set({
      isAuthenticated: false,
      email: null,
      jwtToken: null,
      mek: null,
    });
  },
}));
