import * as LocalAuthentication from 'expo-local-authentication';
import { logger } from '@securevault/utils-native';

/**
 * Check if biometric authentication is available on this device.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  } catch (e) {
    logger.error('Error checking biometric availability', e);
    return false;
  }
}

/**
 * Prompt the user for biometric authentication.
 * Returns true if authentication succeeded.
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access SecureVault X',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
    });

    if (!result.success && result.error) {
      logger.warn(`Biometric authentication failed: ${result.error}`);
    }

    return result.success;
  } catch (e) {
    logger.error('Critical error during biometric authentication', e);
    return false;
  }
}

export const promptBiometric = async (): Promise<boolean> => {
  try {
    logger.info('Prompting for biometric authentication...');
    const success = await authenticateWithBiometric();
    if (success) {
      logger.info('Biometric authentication successful');
      return true;
    } else {
      logger.warn('Biometric authentication failed or cancelled');
      return false;
    }
  } catch (e) {
    logger.error('Uncaught error during manual biometric prompt', e);
    return false;
  }
};
