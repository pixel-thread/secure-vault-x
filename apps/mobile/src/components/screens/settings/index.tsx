import { View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/auth';
import { useColorScheme } from 'nativewind';
import Header from '../../Header';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import { AUTH_ENDPOINT, DEVICE_ENDPOINT, VAULT_ENDPOINT } from '@securevault/constants';
import { http } from '@securevault/utils-native';
import { tokenManager } from '@securevault/libs';
import { decryptData } from '@securevault/crypto';
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { logger } from '@securevault/utils';
import { useState, useEffect, useCallback } from 'react';
import { isBiometricAvailable } from '../../../utils/biometricLock';

interface DeviceItem {
  id: string;
  deviceName: string;
  isTrusted: boolean;
  createdAt: string;
}

export default function SettingsScreen() {
  const { logout, setIsLoading, user } = useAuthStore();
  const purgeLocalEnclave = useAuthStore((state) => state.purgeLocalEnclave);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Biometric state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(user?.isMfaEnable ?? false);

  // Check biometric availability & stored preference on mount
  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      const stored = await SecureStore.getItemAsync('SV_BIOMETRIC_ENABLED');
      setBiometricEnabled(stored === 'true');
    })();
  }, []);

  // ── Logout ──
  const { mutate: logoutMutate } = useMutation({
    mutationFn: (token: string) =>
      http.post<null>(AUTH_ENDPOINT.POST_LOGOUT, { refreshToken: token }),
    onSuccess: async (data) => {
      if (data.success) {
        await tokenManager.removeAllTokens();
        toast.success('Signed out successfully');
        logout();
        setIsLoading(false);
        router.push('/auth');
      }
    },
  });

  const handleLogout = async () => {
    setIsLoading(true);
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) return;
    logoutMutate(refreshToken);
  };

  // ── Purge ──
  const handlePurge = useCallback(() => {
    Alert.alert(
      'Purge Local Enclave',
      'This will permanently destroy your local encryption keys. You will be logged out and must re-authenticate to access your vault. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: async () => {
            await purgeLocalEnclave();
            toast.success('Local enclave purged');
            router.replace('/');
          },
        },
      ]
    );
  }, [purgeLocalEnclave]);

  // ── Export Vault ──
  const handleExportVault = useCallback(async () => {
    try {
      const response = await http.get<any[]>(VAULT_ENDPOINT.GET_VAULT);
      const entries = response?.data ?? [];

      if (!Array.isArray(entries) || entries.length === 0) {
        toast.error('Vault is empty — nothing to export');
        return;
      }

      const mek = await SecureStore.getItemAsync('SV_MEK');
      if (!mek) {
        toast.error('MEK not found — cannot decrypt vault');
        return;
      }

      const decrypted: any[] = [];
      for (const entry of entries) {
        if (!entry.encryptedData || !entry.iv) continue;
        try {
          const payload = await decryptData<any>(entry.encryptedData, entry.iv, mek);
          decrypted.push(payload);
        } catch {
          logger.error('Skipped undecryptable entry during export');
        }
      }

      if (decrypted.length === 0) {
        toast.error('No entries could be decrypted');
        return;
      }

      const json = JSON.stringify(decrypted, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFile = new File(Paths.document, `securevault-export-${timestamp}.json`);
      exportFile.create();
      exportFile.write(json);

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(exportFile.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Vault',
        });
      } else {
        toast.success(`Exported to ${exportFile.uri}`);
      }
    } catch (err) {
      logger.error('Export vault failed', err);
      toast.error('Failed to export vault');
    }
  }, []);

  // ── Biometric Toggle ──
  const handleBiometricToggle = useCallback(
    async (value: boolean) => {
      if (value && !biometricAvailable) {
        toast.error('Biometric authentication is not available on this device');
        return;
      }
      await SecureStore.setItemAsync('SV_BIOMETRIC_ENABLED', value ? 'true' : 'false');
      setBiometricEnabled(value);
      toast.success(value ? 'Biometric lock enabled' : 'Biometric lock disabled');
    },
    [biometricAvailable]
  );

  // ── MFA Toggle ──
  const { mutate: toggleMfaMutate, isPending: mfaPending } = useMutation({
    mutationFn: (enabled: boolean) =>
      http.post<{ mfaEnabled: boolean }>(AUTH_ENDPOINT.POST_MFA_TOGGLE, { enabled }),
    onSuccess: (data) => {
      if (data.success && data.data) {
        setMfaEnabled(data.data.mfaEnabled);
        toast.success(
          data.data.mfaEnabled
            ? 'Two-factor authentication enabled'
            : 'Two-factor authentication disabled'
        );
      }
    },
    onError: () => toast.error('Failed to toggle MFA'),
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
        ]
      );
    },
    [toggleMfaMutate]
  );

  // ── Devices ──
  const { data: devices = [], refetch: refetchDevices } = useQuery<DeviceItem[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await http.get<DeviceItem[]>(DEVICE_ENDPOINT.GET_DEVICES);
      return res?.data ?? [];
    },
  });

  const getActingDeviceId = async () => {
    // In a real app, this should securely identify the CURRENT device from SecureStore
    // For this example, we'll try to find the earliest trusted device as a fallback
    const id = await SecureStore.getItemAsync('SV_DEVICE_ID');
    if (id) return id;
    const trusted = devices.find((d) => d.isTrusted);
    return trusted?.id ?? '';
  };

  const { mutate: removeDeviceMutate } = useMutation({
    mutationFn: async (deviceId: string) => {
      const actingId = await getActingDeviceId();
      return http.delete(DEVICE_ENDPOINT.DELETE_DEVICE.replace(':id', deviceId), {
        headers: { 'X-Device-Id': actingId },
      });
    },
    onSuccess: () => {
      toast.success('Device removed');
      refetchDevices();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to remove device'),
  });

  const handleRemoveDevice = useCallback(
    (deviceId: string, deviceName: string) => {
      Alert.alert('Remove Device', `Remove "${deviceName}" from trusted devices?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeDeviceMutate(deviceId),
        },
      ]);
    },
    [removeDeviceMutate]
  );

  const { mutate: toggleTrustMutate } = useMutation({
    mutationFn: async ({ deviceId, isTrusted }: { deviceId: string; isTrusted: boolean }) => {
      const actingId = await getActingDeviceId();
      return http.put(
        DEVICE_ENDPOINT.PUT_TRUST_DEVICE.replace(':id', deviceId),
        { isTrusted },
        { headers: { 'X-Device-Id': actingId } }
      );
    },
    onSuccess: () => {
      toast.success('Device trust status updated');
      refetchDevices();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || 'Failed to update trust status'),
  });

  const handleToggleTrust = useCallback(
    (deviceId: string, deviceName: string, isTrusted: boolean) => {
      Alert.alert(
        isTrusted ? 'Trust Device' : 'Untrust Device',
        isTrusted
          ? `Mark "${deviceName}" as a trusted device? It will be able to manage other devices.`
          : `Remove trust from "${deviceName}"? It will lose device management capabilities.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: isTrusted ? 'Trust' : 'Untrust',
            style: isTrusted ? 'default' : 'destructive',
            onPress: () => toggleTrustMutate({ deviceId, isTrusted }),
          },
        ]
      );
    },
    [toggleTrustMutate]
  );

  return (
    <View className="flex-1 bg-white dark:bg-[#09090b]">
      <Header title="Settings" subtitle="Device Preferences" />

      <ScrollView
        className="flex-1 p-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* App Appearance */}
        <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          App Appearance
        </Text>
        <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <TouchableOpacity
            className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60"
            onPress={toggleColorScheme}>
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">Dark Mode</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                {isDarkMode ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Ionicons name="swap-horizontal-outline" size={20} color="#71717a" />
          </TouchableOpacity>
        </View>

        {/* Security Controls */}
        <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Security Controls
        </Text>
        <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
          {/* Biometric Lock */}
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

          {/* MFA Toggle */}
          <View className="flex-row items-center p-5">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                Two-Factor Auth
              </Text>
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
        </View>

        {/* Trusted Devices */}
        <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Trusted Devices
        </Text>
        <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
          {devices.length === 0 ? (
            <View className="items-center p-6">
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                No devices registered
              </Text>
            </View>
          ) : (
            devices.map((device, index) => (
              <View
                key={device.id}
                className={`flex-row items-center p-5 ${
                  index < devices.length - 1
                    ? 'border-b border-zinc-100 dark:border-zinc-800/50'
                    : ''
                }`}>
                <View
                  className={`mr-4 h-10 w-10 items-center justify-center rounded-xl ${
                    device.isTrusted
                      ? 'bg-emerald-100 dark:bg-emerald-500/20'
                      : 'bg-zinc-200 dark:bg-zinc-800/80'
                  }`}>
                  <Ionicons
                    name={device.isTrusted ? 'shield-checkmark-outline' : 'phone-portrait-outline'}
                    size={22}
                    color={device.isTrusted ? '#10b981' : isDarkMode ? '#a1a1aa' : '#71717a'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                    {device.deviceName}
                  </Text>
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                    {device.isTrusted ? 'Trusted • ' : 'Untrusted • '}
                    {new Date(device.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      device.isTrusted
                        ? 'bg-amber-100 active:bg-amber-200 dark:bg-amber-500/10 dark:active:bg-amber-500/20'
                        : 'bg-emerald-100 active:bg-emerald-200 dark:bg-emerald-500/10 dark:active:bg-emerald-500/20'
                    }`}
                    onPress={() =>
                      handleToggleTrust(device.id, device.deviceName, !device.isTrusted)
                    }>
                    <Ionicons
                      name={device.isTrusted ? 'shield-half-outline' : 'shield-checkmark-outline'}
                      size={18}
                      color={device.isTrusted ? '#f59e0b' : '#10b981'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="h-10 w-10 items-center justify-center rounded-full bg-red-100 active:bg-red-200 dark:bg-red-500/10 dark:active:bg-red-500/20"
                    onPress={() => handleRemoveDevice(device.id, device.deviceName)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Export & Sync */}
        <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Data Management
        </Text>
        <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <TouchableOpacity
            className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60"
            onPress={handleExportVault}>
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name="download-outline"
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">Export Vault</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Download decrypted JSON
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-red-500/80">
          Danger Zone
        </Text>
        <View className="mb-8 overflow-hidden rounded-3xl border border-red-200 bg-zinc-50 shadow-sm dark:border-red-900/40 dark:bg-zinc-900/50">
          <TouchableOpacity
            className="flex-row items-center p-5 active:bg-red-50 dark:active:bg-red-500/10"
            onPress={handlePurge}>
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/10">
              <Ionicons name="warning-outline" size={22} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-red-600 dark:text-red-500">
                Purge Enclave
              </Text>
              <Text className="text-sm text-red-500/80 dark:text-red-400/80">
                Destroys local keys
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          className="mb-6 mt-auto w-full flex-row items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 py-4 shadow-sm active:bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:active:bg-zinc-800"
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
          <Text className="ml-2 text-lg font-bold text-zinc-600 dark:text-zinc-300">
            Sign Out Device
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
