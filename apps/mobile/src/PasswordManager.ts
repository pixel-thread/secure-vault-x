import { NativeModules, Platform } from 'react-native';
const { PasswordManager: Native } = NativeModules;
export const PasswordManager = {
  syncVault: (sm) => Native.syncVault(JSON.stringify(sm)),
  clearVault: () => Native.clearVault(),
  get: (s) => Native.getCredentials(s).then(JSON.parse),
  resolveAutofill: (c) => Native.resolveAutofill(c.username, c.password),
  cancelAutofill: () => Native.cancelAutofill(),
  getAutofillContext: () =>
    Platform.OS === 'android' ? Native.getAutofillContext() : Promise.resolve(null),
};
