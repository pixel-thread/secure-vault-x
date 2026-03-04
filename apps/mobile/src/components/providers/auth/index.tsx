import { useAuthStore } from '@/src/store/auth';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { tokenManager } from '@securevault/libs';
import { UserT } from '@securevault/types';
import { logger } from '@securevault/utils';
import { http } from '@securevault/utils-native';
import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authenticateWithBiometric } from '@/src/utils/biometricLock';

type Props = { children: React.ReactNode };

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const { setIsLoading, isLoading, setUser, isAuthenticated, setIsAuthenticated, setHasMek } =
    useAuthStore();
  const [biometricPassed, setBiometricPassed] = useState(false);
  const [biometricRequired, setBiometricRequired] = useState(false);

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

  const promptBiometric = async () => {
    const success = await authenticateWithBiometric();
    if (success) {
      setBiometricPassed(true);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        await tokenManager.init();
        const access = await tokenManager.getAccessToken();
        const refreshToken = await tokenManager.getRefreshToken();

        const hasTokens = !!(access && refreshToken);

        // Check biometric requirement only if we have an active session
        if (hasTokens) {
          const biometricEnabled = await SecureStore.getItemAsync('SV_BIOMETRIC_ENABLED');
          if (biometricEnabled === 'true') {
            setBiometricRequired(true);
            // Prompt immediately
            const success = await authenticateWithBiometric();
            if (success) {
              setBiometricPassed(true);
            }
          } else {
            setBiometricPassed(true); // No biometric required
          }
        } else {
          setBiometricPassed(true); // Not logged in, no biometric needed
        }

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

  // Biometric gate — show lock screen if biometric is required but not passed
  if (biometricRequired && !biometricPassed) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#09090b]">
        <View className="items-center">
          <View className="mb-6 h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
            <Ionicons name="finger-print" size={48} color="#10b981" />
          </View>
          <Text className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
            SecureVault Locked
          </Text>
          <Text className="mb-8 text-center text-zinc-500 dark:text-zinc-400">
            Authenticate to access your vault
          </Text>
          <TouchableOpacity
            className="rounded-2xl bg-emerald-500 px-8 py-4 shadow-xl shadow-emerald-500/20 active:scale-95"
            onPress={promptBiometric}>
            <Text className="text-lg font-bold text-[#022c22]">Unlock</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
};
