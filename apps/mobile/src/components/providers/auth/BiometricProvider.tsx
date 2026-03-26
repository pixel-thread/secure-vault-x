import { useCallback, useEffect, useState, useRef } from 'react';
import {
  promptBiometric as manualBiometricPrompt,
  isBiometricAvailable,
} from '@utils/biometricLock';
import { DeviceStoreManager } from '@securevault/libs';
import { logger } from '@securevault/utils-native';
import { BioMetricLock } from '@components/common/BiometricLock';

type Props = {
  children: React.ReactNode;
};

/**
 * BiometricProvider handles the biometric gate for both the main app
 * and the specialized Autofill view.
 *
 * NOTE: We've added a settle delay and mount guards to prevent "app_cancel"
 * collisions during rapid component transitions (e.g. from app launch to autofill overlay).
 */
export const BiometricProvider: React.FC<Props> = ({ children }) => {
  const [biometricPassed, setBiometricPassed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const isMounted = useRef(true);
  const isPrompting = useRef(false);
  const checkCount = useRef(0);

  const promptBiometric = useCallback(async () => {
    if (isPrompting.current) {
      logger.warn('[BIO] Prompt already in progress, skipping redundant request');
      return;
    }

    try {
      isPrompting.current = true;
      checkCount.current++;
      logger.info(`[BIO] Attempting prompt #${checkCount.current}`);
      setIsChecking(true);

      const success = await manualBiometricPrompt();

      if (!isMounted.current) {
        logger.warn('[BIO] Prompt finished but component unmounted');
        return;
      }

      if (success) {
        logger.info('[BIO] Authentication successful');
        setBiometricPassed(true);
      } else {
        logger.warn('[BIO] Authentication failed or cancelled');
        setBiometricPassed(false);
      }
    } catch (e) {
      logger.error('[BIO] Critical error in prompt', e);
    } finally {
      isPrompting.current = false;
      if (isMounted.current) setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    logger.info('[BIO] Provider mounted');

    async function init() {
      try {
        // CRITICAL: Settle delay.
        // During app launch, the RootLayout might switch from "App" to "Autofill" mode
        // very quickly. This delay gives the system time to clear any previous prompts
        // or layout transitions before we start a new biometric session.
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (!isMounted.current) return;

        const isBiometricEnabled = await DeviceStoreManager.getBiometricEnabled();
        const isHardwareAvailable = await isBiometricAvailable();

        logger.info('[BIO] Init check', { isBiometricEnabled, isHardwareAvailable });

        if (!isMounted.current) return;

        if (isBiometricEnabled && isHardwareAvailable) {
          await promptBiometric();
        } else {
          logger.info('[BIO] Bypassing (not enabled or no hardware)');
          setBiometricPassed(true);
          setIsChecking(false);
        }
      } catch (e) {
        logger.error('[BIO] Init error', e);
        if (isMounted.current) setIsChecking(false);
      }
    }

    init();

    return () => {
      logger.info('[BIO] Provider unmounting');
      isMounted.current = false;
    };
  }, [promptBiometric]);

  // If we are still initializing the check, we show nothing (splash or blank)
  // to avoid flicker or collision with previous UIs
  if (isChecking && !biometricPassed) {
    return null;
  }

  // If check failed/cancelled, show the dedicated lock screen
  if (!biometricPassed) {
    return <BioMetricLock onPressUnlock={promptBiometric} />;
  }

  // Successful verification, render protected children
  return <>{children}</>;
};
