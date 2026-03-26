import { NativeModules } from 'react-native';

const { PasswordManager } = NativeModules;

export interface PasswordManagerInterface {
  saveCredential(domainOrPackage: string, username: string, pass: string): Promise<boolean>;
  getCredentials(domainOrPackage: string): Promise<string>;
}

export const usePasswordManager = (): PasswordManagerInterface => {
  const saveCredential = async (
    domainOrPackage: string,
    username: string,
    pass: string,
  ): Promise<boolean> => {
    if (!PasswordManager) {
      console.warn('PasswordManager native module is not linked.');
      return false;
    }
    try {
      return await PasswordManager.saveCredential(domainOrPackage, username, pass);
    } catch (e) {
      console.error('Failed to save to system autofill', e);
      return false;
    }
  };

  const getCredentials = async (domainOrPackage: string): Promise<string> => {
    if (!PasswordManager) {
      console.warn('PasswordManager native module is not linked.');
      return '[]';
    }
    try {
      return await PasswordManager.getCredentials(domainOrPackage);
    } catch (e) {
      console.error('Failed to get system autofill credentials', e);
      return '[]';
    }
  };

  return { saveCredential, getCredentials };
};
