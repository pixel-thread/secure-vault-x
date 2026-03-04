import * as Application from 'expo-application';
import { Platform } from 'react-native';

export async function getDeviceIdentifier(): Promise<string> {
  if (Platform.OS === 'android') {
    return Application.getAndroidId();
  } else {
    const id = await Application.getIosIdForVendorAsync();
    return id ?? 'unknown-device';
  }
}
