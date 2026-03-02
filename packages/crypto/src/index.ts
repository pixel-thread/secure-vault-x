import { Buffer } from 'buffer';

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
 * Generates a cryptographically secure 256-bit (32 byte) Master Encryption Key (MEK).
 * Returned as a native base64 string.
 */
export async function generateMEK(): Promise<string> {
 const cryptoApi = getCryptoApi();
 const keyBuffer = new Uint8Array(32);
 cryptoApi.getRandomValues(keyBuffer);
 return Buffer.from(keyBuffer).toString('base64');
}

/**
 * Encrypts a plaintext string into an AES-256-GCM cipher envelope using the provided base64 MEK.
 * The 128-bit auth tag is naturally appended to the cipher by the Web Crypto API.
 */
export async function encryptData(data: string, base64Key: string): Promise<{ encryptedData: string; iv: string }> {
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
 const encodedText = new TextEncoder().encode(data);

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
 */
export async function decryptData(encryptedBase64: string, ivBase64: string, base64Key: string): Promise<string> {
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

 return new TextDecoder().decode(decryptedBuffer);
}
