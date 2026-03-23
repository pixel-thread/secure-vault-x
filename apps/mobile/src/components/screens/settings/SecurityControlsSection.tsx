import { View, Text, Switch, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner-native';
import { DeviceStoreManager } from '@store/device';
import { isBiometricAvailable, authenticateWithBiometric } from '@utils/biometricLock';
import { useAuthStore } from '@store/auth';
import { useMutation } from '@tanstack/react-query';
import { http } from '@securevault/utils-native';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { useNotification } from '@hooks/useNotification';

export default function SecurityControlsSection() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { user } = useAuthStore();
  const { isNotificationsEnabled, toggleNotifications } = useNotification();

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(user?.isMfaEnable ?? false);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      const stored = await DeviceStoreManager.getBiometricEnabled();
      setBiometricEnabled(stored);
    })();
  }, []);

  const handleBiometricToggle = useCallback(
    async (value: boolean) => {
      if (value && !biometricAvailable) {
        toast.error('Biometric authentication is not available on this device');
        return;
      }

      // If disabling, require authentication first
      if (!value) {
        const success = await authenticateWithBiometric();
        if (!success) {
          toast.error('Authentication failed — biometric lock remained enabled');
          return;
        }
      }

      await DeviceStoreManager.setBiometricEnabled(value);
      setBiometricEnabled(value);
      toast.success(value ? 'Secure AF' : 'Security lowered');
    },
    [biometricAvailable],
  );

  const { mutate: toggleMfaMutate, isPending: mfaPending } = useMutation({
    mutationFn: (enabled: boolean) =>
      http.post<{ mfaEnabled: boolean }>(AUTH_ENDPOINT.POST_MFA_TOGGLE, { enabled }),
    onSuccess: (data) => {
      // Toggle successful
      if (data.success && data.data) {
        setMfaEnabled(data.data.mfaEnabled);
        toast.success(data.data.mfaEnabled ? '2FA is on!' : '2FA is off');
      } else {
        // Toggle failed but returned 200 OK (e.g. wrapper error)
        toast.error(data.message || 'Failed to toggle MFA');
      }
    },
    onError: (error: any) => {
      // Toggle failed with 4xx/5xx status code
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to toggle MFA';
      toast.error(errorMessage);
    },
  });

  const handleMfaToggle = useCallback(
    (value: boolean) => {
      Alert.alert(
        value ? 'Enable 2FA' : 'Disable 2FA',
        value
          ? 'You will be required to enter an OTP code sent to your email on each login.'
          : 'Are you sure? Your account will be less secure without 2FA.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: value ? 'Enable' : 'Disable',
            style: value ? 'default' : 'destructive',
            onPress: () => toggleMfaMutate(value),
          },
        ],
      );
    },
    [toggleMfaMutate],
  );

  return (
    <>
      <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Security Controls
      </Text>
      <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
        {biometricAvailable && (
          <View className="flex-row items-center border-b border-zinc-100 p-5 dark:border-zinc-800/50">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name="finger-print-outline"
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                Biometric Lock
              </Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Require on app launch
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#3f3f46', true: '#059669' }}
              thumbColor="#fff"
            />
          </View>
        )}

        <View className="flex-row items-center p-5">
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color={isDarkMode ? '#10b981' : '#059669'}
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">Two-Factor Auth</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              {mfaEnabled ? 'Enabled — OTP on login' : 'Disabled'}
            </Text>
          </View>
          <Switch
            value={mfaEnabled}
            onValueChange={handleMfaToggle}
            disabled={mfaPending}
            trackColor={{ false: '#3f3f46', true: '#059669' }}
            thumbColor="#fff"
          />
        </View>

        <View className="flex-row items-center border-t border-zinc-100 p-5 dark:border-zinc-800/50">
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
            <Ionicons
              name="notifications-outline"
              size={22}
              color={isDarkMode ? '#10b981' : '#059669'}
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">Rotation Alerts</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Notify before secrets expire
            </Text>
          </View>
          <Switch
            value={isNotificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#3f3f46', true: '#059669' }}
            thumbColor="#fff"
          />
        </View>

        <View className="flex-row items-center border-t border-zinc-100 p-5 dark:border-zinc-800/50">
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
            <Ionicons name="key-outline" size={22} color={isDarkMode ? '#10b981' : '#059669'} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">Change Password</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Update your account password
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings/change-password')}
            className="rounded-full bg-zinc-200 p-2 dark:bg-zinc-800"
          >
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#a1a1aa' : '#52525b'} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
