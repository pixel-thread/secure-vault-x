import { useAuthStore } from '@store/auth';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { tokenManager } from '@securevault/libs';
import { UserT } from '@securevault/types';
import { http, logger, isConnectedToNetwork } from '@securevault/utils-native';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { DeviceStoreManager } from '@store/device';

type Props = { children: React.ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const { setIsLoading, setUser, setIsAuthenticated, setHasMek } = useAuthStore();

  const { mutate } = useMutation({
    mutationFn: () => http.get<any>(AUTH_ENDPOINT.GET_ME),
    onSuccess: async (data: { success: boolean; data?: UserT }) => {
      logger.info('Auth background verification successful');
      if (data.success && data?.data) {
        setUser(data.data);
        setIsAuthenticated(true);
        await DeviceStoreManager.setUser(data.data);
      } else {
        setIsAuthenticated(false);
        await DeviceStoreManager.removeUser();
      }
      setIsLoading(false);
    },
    onError: async (error: any) => {
      logger.error('Auth background verification failed', error);

      if (error?.status === 401 || error?.status === 403) {
        setIsAuthenticated(false);
        await tokenManager.removeAllTokens();
        await DeviceStoreManager.removeUser();
      } else {
        const storedUser = await DeviceStoreManager.getUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    },
  });

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        setIsLoading(true);
        await tokenManager.init();
        const access = await tokenManager.getAccessToken();
        const refreshToken = await tokenManager.getRefreshToken();
        const hasTokens = !!(access && refreshToken);

        const cachedUser = await DeviceStoreManager.getUser();
        if (cachedUser && hasTokens) {
          setUser(cachedUser);
          setIsAuthenticated(true);
        }

        // CRITICAL: Skip app-level biometric prompt if we are in autofill mode.
        // The autofill flow should be as lightweight as possible and can prompt separately if needed.
        const mek = await DeviceStoreManager.getMek();
        setHasMek(!!mek);

        const isDeviceConnectedToNetwork = await isConnectedToNetwork();
        if (hasTokens && isDeviceConnectedToNetwork && active) {
          mutate();
        } else {
          if (!hasTokens && active) {
            setIsAuthenticated(false);
          }
          if (active) setIsLoading(false);
        }
      } catch (e) {
        if (active) {
          setIsLoading(false);
          logger.error('Error initializing auth provider', e);
        }
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [mutate, setHasMek, setIsLoading, setIsAuthenticated, setUser]);

  return <>{children}</>;
};
