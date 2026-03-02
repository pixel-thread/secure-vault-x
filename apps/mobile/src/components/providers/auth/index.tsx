import { useAuthStore } from '@/src/store/auth';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { tokenManager } from '@securevault/libs';
import { UserT } from '@securevault/types';
import { logger } from '@securevault/utils';
import { http } from '@securevault/utils-native';
import { useMutation } from '@tanstack/react-query';
import React, { useEffect } from 'react';

type Props = { children: React.ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const { setIsLoading, isLoading, setUser, isAuthenticated, setIsAuthenticated } = useAuthStore();

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
        const access = tokenManager.getAccessToken();
        const refresh = tokenManager.getRefreshToken();

        if (access && refresh) {
          setIsAuthenticated(true);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        setIsLoading(false);
        logger.error('Error initializing token manager', e);
      }
    }

    init();
  }, []); // Only on mount

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
