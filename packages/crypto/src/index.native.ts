import { Buffer } from 'buffer';
import { generateInitialMEK, recoverMEK } from './argon2';

const getCryptoApi = (): Crypto => {
 if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
  return globalThis.crypto as Crypto;
 }
 if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Hide from Metro bundler's static analysis
  const nodeRequire = eval('require');
  return nodeRequire('node:crypto').webcrypto as Extract<Crypto, any>;
 }
 throw new Error('Web Crypto API not available natively via Expo Go. Please run the app via a Dev Client (`npx expo run:ios` or `npx expo run:android`) to inject Native Modules.');
};

/**
 * Generates a cryptographically secure 256-bit (32 byte) random key.
 * Returned as a native base64 string.
 */
export async function generateRandomKey(): Promise<string> {
 const cryptoApi = getCryptoApi();
 const keyBuffer = new Uint8Array(32);
 cryptoApi.getRandomValues(keyBuffer as any);
 return Buffer.from(keyBuffer).toString('base64');
}

/**
 * Generates a cryptographically secure 256-bit (32 byte) Master Encryption Key (MEK) using Argon2id.
 * If salt is not provided, a random one will be generated.
 * Returns both the derived MEK and the salt used as base64 strings.
 */
export async function generateMEK(password: string, base64Salt?: string): Promise<{ mek: string; salt: string }> {
 if (base64Salt) {
  const saltBuffer = new Uint8Array(Buffer.from(base64Salt, "base64"));
  const mekBuffer = await recoverMEK(password, saltBuffer);
  return {
   mek: Buffer.from(mekBuffer).toString("base64"),
   salt: base64Salt,
  };
 } else {
  const cryptoApi = getCryptoApi();
  const salt = new Uint8Array(16);
  cryptoApi.getRandomValues(salt);
  const { mek } = await generateInitialMEK(password, salt);
  return {
   mek: Buffer.from(mek).toString("base64"),
   salt: Buffer.from(salt).toString("base64"),
  };
 }
}

/**
 * Encrypts a generic payload into an AES-256-GCM cipher envelope using the provided base64 MEK.
 * The 128-bit auth tag is naturally appended to the cipher by the Web Crypto API.
 */
export async function encryptData<T>(data: T, base64Key: string): Promise<{ encryptedData: string; iv: string }> {
 const cryptoApi = getCryptoApi();
 const keyBuffer = Buffer.from(base64Key, 'base64');
 const key = await cryptoApi.subtle.importKey(
  'raw',
  keyBuffer,
  { name: 'AES-GCM' },
  false,
  ['encrypt']
 );

 const iv = cryptoApi.getRandomValues(new Uint8Array(12));
 const stringData = JSON.stringify(data);
 const encodedText = new TextEncoder().encode(stringData);

 const encryptedBuffer = await cryptoApi.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  encodedText
 );

 return {
  encryptedData: Buffer.from(encryptedBuffer).toString('base64'),
  iv: Buffer.from(iv).toString('base64'),
 };
}

/**
 * Decrypts an AES-256-GCM cipher envelope provided the cipher, the matching IV, and the base64 MEK.
 * Converts the decrypted string back into the generic type T.
 */
export async function decryptData<T>(encryptedBase64: string, ivBase64: string, base64Key: string): Promise<T> {
 const cryptoApi = getCryptoApi();
 const keyBuffer = Buffer.from(base64Key, 'base64');
 const key = await cryptoApi.subtle.importKey(
  'raw',
  keyBuffer,
  { name: 'AES-GCM' },
  false,
  ['decrypt']
 );

 const iv = Buffer.from(ivBase64, 'base64');
 const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');

 const decryptedBuffer = await cryptoApi.subtle.decrypt(
  { name: 'AES-GCM', iv },
  key,
  encryptedBuffer
 );

 const decryptedString = new TextDecoder().decode(decryptedBuffer);
 return JSON.parse(decryptedString) as T;
}
