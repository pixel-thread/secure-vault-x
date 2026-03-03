import { useAuthStore } from '@/src/store/auth';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { tokenManager } from '@securevault/libs';
import { UserT } from '@securevault/types';
import { logger } from '@securevault/utils';
import { http } from '@securevault/utils-native';
import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect } from 'react';

type Props = { children: React.ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const { setIsLoading, isLoading, setUser, isAuthenticated, setIsAuthenticated, setHasMek } = useAuthStore();

  const { isPending, mutate } = useMutation({
    mutationFn: () => http.get<UserT>(AUTH_ENDPOINT.GET_ME),
    onSuccess: async (data) => {
      if (data.success && data?.data) {
        setUser(data.data);
      }
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  useEffect(() => {
    async function init() {
      try {
        await tokenManager.init();
        const access = await tokenManager.getAccessToken();
        const refreshToken = await tokenManager.getRefreshToken();

        // Check MEK
        const mek = await SecureStore.getItemAsync('SV_MEK');
        if (mek) {
          setHasMek(true);
        } else {
          setHasMek(false);
        }

        if (access && refreshToken) {
          setIsAuthenticated(true);
          if (!isPending) {
            mutate();
          }
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        setIsLoading(false);
        logger.error('Error initializing token manager', e);
      }
    }

    init();
  }, [setIsLoading, mutate, setIsAuthenticated, setHasMek]); // Only on mount

  useEffect(() => {
    if (isAuthenticated) {
      mutate();
    }
  }, [isAuthenticated, mutate]);

  useEffect(() => {
    if (isPending && !isLoading) {
      setIsLoading(isPending);
    }
  }, [isPending, isLoading, setIsLoading]);

  return <>{children}</>;
};
