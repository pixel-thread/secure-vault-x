import * as SecureStore from 'expo-secure-store';

const KEYS = {
 DKEK: 'SV_DKEK',
 MEK: 'SV_MEK',
 DEVICE_ID: 'SV_DEVICE_ID',
 DEVICE_ID_RESERVE: 'SV_DEVICE_ID_RESERVE',
 DEVICE_PRIVATE_KEY: 'SV_DEVICE_PRIVATE_KEY',
} as const;

export const DeviceStoreManager = {
 // DKEK
 getDkek: async () => await SecureStore.getItemAsync(KEYS.DKEK),
 setDkek: async (value: string) => await SecureStore.setItemAsync(KEYS.DKEK, value),
 removeDkek: async () => await SecureStore.deleteItemAsync(KEYS.DKEK),

 // MEK
 getMek: async () => await SecureStore.getItemAsync(KEYS.MEK),
 setMek: async (value: string) => await SecureStore.setItemAsync(KEYS.MEK, value),
 removeMek: async () => await SecureStore.deleteItemAsync(KEYS.MEK),

 // Device ID
 getDeviceId: async () => await SecureStore.getItemAsync(KEYS.DEVICE_ID),
 setDeviceId: async (value: string) => await SecureStore.setItemAsync(KEYS.DEVICE_ID, value),
 removeDeviceId: async () => await SecureStore.deleteItemAsync(KEYS.DEVICE_ID),

 // Reserve Device ID
 getDeviceIdReserve: async () => await SecureStore.getItemAsync(KEYS.DEVICE_ID_RESERVE),
 setDeviceIdReserve: async (value: string) => await SecureStore.setItemAsync(KEYS.DEVICE_ID_RESERVE, value),
 removeDeviceIdReserve: async () => await SecureStore.deleteItemAsync(KEYS.DEVICE_ID_RESERVE),

 // Private Key
 getDevicePrivateKey: async () => await SecureStore.getItemAsync(KEYS.DEVICE_PRIVATE_KEY),
 setDevicePrivateKey: async (value: string) => await SecureStore.setItemAsync(KEYS.DEVICE_PRIVATE_KEY, value),
 removeDevicePrivateKey: async () => await SecureStore.deleteItemAsync(KEYS.DEVICE_PRIVATE_KEY),

 // Biometric Settings
 getBiometricEnabled: async () => (await SecureStore.getItemAsync('SV_BIOMETRIC_ENABLED')) === 'true',
 setBiometricEnabled: async (value: boolean) => await SecureStore.setItemAsync('SV_BIOMETRIC_ENABLED', value ? 'true' : 'false'),
 removeBiometricEnabled: async () => await SecureStore.deleteItemAsync('SV_BIOMETRIC_ENABLED'),

 // Bulk Operations
 clearAll: async () => {
  await Promise.all([
   SecureStore.deleteItemAsync(KEYS.DKEK),
   SecureStore.deleteItemAsync(KEYS.MEK),
   SecureStore.deleteItemAsync(KEYS.DEVICE_ID),
   SecureStore.deleteItemAsync(KEYS.DEVICE_ID_RESERVE),
   SecureStore.deleteItemAsync(KEYS.DEVICE_PRIVATE_KEY),
   SecureStore.deleteItemAsync('SV_BIOMETRIC_ENABLED'),
  ]);
 },
};
