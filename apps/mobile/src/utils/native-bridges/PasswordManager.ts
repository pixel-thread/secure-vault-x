import { NativeModules, Platform } from 'react-native';

const { PasswordManager: Native } = NativeModules;

export interface Credential {
  id: string; // Critical for matching and React keys
  username: string;
  password?: string;
}

export const PasswordManager = {
  syncVault: () => Promise.resolve(true),
  clearVault: () => Promise.resolve(true),
  resolveAutofill: (c: Credential) => Native.resolveAutofill(c.username, c.password),
  cancelAutofill: () => Native.cancelAutofill(),
  getAutofillContext: (): Promise<{ siteKey: string } | null> =>
    Platform.OS === 'android' ? Native.getAutofillContext() : Promise.resolve(null),
};
