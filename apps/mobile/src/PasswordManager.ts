/**
 * PasswordManager.ts
 *
 * React Native JS/TS API for SecureVaultX.
 * Drop this file into your src/ directory.
 *
 * Usage:
 *   import { PasswordManager } from './PasswordManager';
 *
 *   // Save a credential
 *   await PasswordManager.save('github.com', 'alice@example.com', 'hunter2');
 *
 *   // Retrieve credentials for a site
 *   const creds = await PasswordManager.get('github.com');
 *   // → [{ username: 'alice@example.com', password: 'hunter2', createdAt: 1234567890 }]
 *
 *   // List all saved sites
 *   const sites = await PasswordManager.listSites();
 *
 *   // Delete a specific credential
 *   await PasswordManager.deleteCredential('github.com', 'alice@example.com');
 *
 *   // Delete all credentials for a site
 *   await PasswordManager.deleteSite('github.com');
 *
 *   // Wipe everything (use with caution)
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
  /**
   * Save (or update) a credential.
   * siteKey can be a domain ('github.com') or package name ('com.github.android').
   */
  save(siteKey: string, username: string, password: string): Promise<boolean> {
    assertAndroid();
    return Native.saveCredential(siteKey, username, password);
  },

  /**
   * Get all saved credentials for a site.
   */
  async get(siteKey: string): Promise<Credential[]> {
    assertAndroid();
    const raw: string = await Native.getCredentials(siteKey);
    return JSON.parse(raw) as Credential[];
  },

  /**
   * Delete one credential by username for a site.
   */
  deleteCredential(siteKey: string, username: string): Promise<boolean> {
    assertAndroid();
    return Native.deleteCredential(siteKey, username);
  },

  /**
   * Delete all credentials for a site.
   */
  deleteSite(siteKey: string): Promise<boolean> {
    assertAndroid();
    return Native.deleteSite(siteKey);
  },

  /**
   * List all sites that have saved credentials.
   */
  async listSites(): Promise<string[]> {
    assertAndroid();
    const raw: string = await Native.listSites();
    return JSON.parse(raw) as string[];
  },

  /**
   * Wipe the entire vault. Irreversible.
   */
  clearAll(): Promise<boolean> {
    assertAndroid();
    return Native.clearAll();
  },
};
