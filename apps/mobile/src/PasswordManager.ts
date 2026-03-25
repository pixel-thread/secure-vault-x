/**
 * PasswordManager.ts
 *
 * React Native JS/TS API for SecureVaultX.
 * Drop this file into your src/ directory.
 *
 * Usage:
 *   import { PasswordManager } from './PasswordManager';
 *
 *   await PasswordManager.save('github.com', 'alice@example.com', 'hunter2');
 *   const creds = await PasswordManager.get('github.com');
 *   const sites = await PasswordManager.listSites();
 *   await PasswordManager.deleteCredential('github.com', 'alice@example.com');
 *   await PasswordManager.deleteSite('github.com');
 *   await PasswordManager.clearAll();
 */

import { NativeModules, Platform } from 'react-native';

export interface Credential {
  username: string;
  password: string;
  createdAt?: number;
  updatedAt?: number;
}

const { PasswordManager: Native } = NativeModules;

function assertAndroid() {
  if (Platform.OS !== 'android') {
    throw new Error('PasswordManager native bridge is Android-only. Use expo-secure-store on iOS.');
  }
}

export const PasswordManager = {
  save(siteKey: string, username: string, password: string): Promise<boolean> {
    assertAndroid();
    return Native.saveCredential(siteKey, username, password);
  },

  async get(siteKey: string): Promise<Credential[]> {
    assertAndroid();
    const raw: string = await Native.getCredentials(siteKey);
    return JSON.parse(raw) as Credential[];
  },

  deleteCredential(siteKey: string, username: string): Promise<boolean> {
    assertAndroid();
    return Native.deleteCredential(siteKey, username);
  },

  deleteSite(siteKey: string): Promise<boolean> {
    assertAndroid();
    return Native.deleteSite(siteKey);
  },

  async listSites(): Promise<string[]> {
    assertAndroid();
    const raw: string = await Native.listSites();
    return JSON.parse(raw) as string[];
  },

  clearAll(): Promise<boolean> {
    assertAndroid();
    return Native.clearAll();
  },
};
