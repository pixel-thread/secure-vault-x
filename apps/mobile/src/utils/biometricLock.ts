import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Check if biometric authentication is available on this device.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return isEnrolled;
}

/**
 * Prompt the user for biometric authentication.
 * Returns true if authentication succeeded.
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access SecureVault',
    fallbackLabel: 'Use Passcode',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });

  return result.success;
}
