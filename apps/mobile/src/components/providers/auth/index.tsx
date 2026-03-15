import { useAuthStore } from '@/src/store/auth';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { tokenManager } from '@securevault/libs';
import { UserT } from '@securevault/types';
import { http, logger } from '@securevault/utils-native';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { authenticateWithBiometric } from '@/src/utils/biometricLock';
import { DeviceStoreManager } from '@/src/store/device';
import { LoadingScreen } from '../../common/LoadingScreen';
import { BioMetricLock } from '../../common/BiometricLock';

type Props = { children: React.ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const { setIsLoading, isLoading, setUser, setIsAuthenticated, setHasMek } = useAuthStore();
  const [biometricPassed, setBiometricPassed] = useState(false);
  const [biometricRequired, setBiometricRequired] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => http.get<UserT>(AUTH_ENDPOINT.GET_ME),
    onSuccess: async (data) => {
      logger.info('Auth initialization successful');
      if (data.success && data?.data) {
        setUser(data.data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    },
    onError: (error) => {
      logger.error('Auth initialization failed', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    },
  });

  const promptBiometric = async () => {
    const success = await authenticateWithBiometric();
    if (success) {
      setBiometricPassed(true);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        await tokenManager.init();
        const access = await tokenManager.getAccessToken();
        const refreshToken = await tokenManager.getRefreshToken();
        const hasTokens = !!(access && refreshToken);

        // Check biometric requirement only if we have an active session
        if (hasTokens) {
          const biometricEnabled = await DeviceStoreManager.getBiometricEnabled();
          if (biometricEnabled) {
            setBiometricRequired(true);
            const success = await authenticateWithBiometric();
            if (success) {
              setBiometricPassed(true);
            } else {
              // Biometric failed or cancelled, we still need to clear initial loading
              // but the biometric gate will handle the UI
              setIsLoading(false);
            }
          } else {
            setBiometricPassed(true);
          }
        } else {
          setBiometricPassed(true);
        }

        const mek = await DeviceStoreManager.getMek();
        setHasMek(!!mek);

        if (hasTokens) {
          mutate();
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        setIsLoading(false);
        logger.error('Error initializing auth provider', e);
      }
    }

    init();
  }, []); // Run once on mount

  // Removed redundant effects that caused race conditions and stuck loading states
  // Biometric gate — show lock screen if biometric is required but not passed
  if (biometricRequired && !biometricPassed) {
    return <BioMetricLock onPressUnlock={promptBiometric} />;
  }

  if (isLoading || isPending) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};
