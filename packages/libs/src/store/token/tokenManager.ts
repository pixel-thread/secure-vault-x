import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'SV_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'SV_REFRESH_TOKEN';

class TokenManager {
 private accessToken: string | null = null;
 private refreshToken: string | null = null;

 // Initialize in-memory cache from SecureStore
 public async init(): Promise<void> {
  this.accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  this.refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
 }

 // Getters
 public getAccessToken(): string | null {
  return this.accessToken;
 }

 public getRefreshToken(): string | null {
  return this.refreshToken;
 }

 public getTokens() {
  return {
   accessToken: this.accessToken,
   refreshToken: this.refreshToken,
  };
 }

 // Setters
 public async setAccessToken(token: string): Promise<void> {
  this.accessToken = token;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
 }

 public async setRefreshToken(token: string): Promise<void> {
  this.refreshToken = token;
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
 }

 public async setBothTokens(access: string, refresh: string): Promise<void> {
  this.accessToken = access;
  this.refreshToken = refresh;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh);
 }

 // Removers
 public async removeAccessToken(): Promise<void> {
  this.accessToken = null;
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
 }

 public async removeRefreshToken(): Promise<void> {
  this.refreshToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
 }

 public async removeAllTokens(): Promise<void> {
  this.accessToken = null;
  this.refreshToken = null;
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
 }
}

export const tokenManager = new TokenManager();