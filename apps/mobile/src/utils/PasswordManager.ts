import { NativeModules, Platform } from 'react-native';

const { PasswordManager: Native } = NativeModules;

export interface Credential {
  username: string;
  password?: string;
}

export const PasswordManager = {
  syncVault: (sm: any) => Promise.resolve(true),
  clearVault: () => Promise.resolve(true),
  get: (s: string): Promise<Credential[]> => Promise.resolve([]),
  resolveAutofill: (c: Credential) => Native.resolveAutofill(c.username, c.password),
  cancelAutofill: () => Native.cancelAutofill(),
  getAutofillContext: (): Promise<{ siteKey: string } | null> =>
    Platform.OS === 'android' ? Native.getAutofillContext() : Promise.resolve(null),
};
