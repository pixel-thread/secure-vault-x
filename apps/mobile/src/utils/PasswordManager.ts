import { NativeModules, Platform } from 'react-native';

const { PasswordManager: Native } = NativeModules;

export interface Credential {
  username: string;
  password?: string;
}

export const PasswordManager = {
  syncVault: (sm: any) => Native.syncVault(JSON.stringify(sm)),
  clearVault: () => Native.clearVault(),
  get: (s: string): Promise<Credential[]> => Native.getCredentials(s).then(JSON.parse),
  resolveAutofill: (c: Credential) => Native.resolveAutofill(c.username, c.password),
  cancelAutofill: () => Native.cancelAutofill(),
  getAutofillContext: (): Promise<{ siteKey: string } | null> =>
    Platform.OS === 'android' ? Native.getAutofillContext() : Promise.resolve(null),
};
