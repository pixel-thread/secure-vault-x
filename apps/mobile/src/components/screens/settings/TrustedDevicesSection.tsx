import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DEVICE_ENDPOINT } from '@securevault/constants';
import { http } from '@securevault/utils-native';
import { toast } from 'sonner-native';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../../store/auth';
import { signDevicePayload } from '@securevault/crypto';

export interface DeviceItem {
  id: string;
  deviceName: string;
  isTrusted: boolean;
  deviceIdentifier: string;
  createdAt: string;
}

export default function TrustedDevicesSection({
  onDevicesLoad,
}: {
  onDevicesLoad?: (devices: DeviceItem[], currentDeviceId: string) => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { user } = useAuthStore();

  const { data: devices = [], refetch: refetchDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => http.get<DeviceItem[]>(DEVICE_ENDPOINT.GET_DEVICES),
    select: (data) => data.data,
  });

  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  const getActingDeviceId = async () => {
    const id = await SecureStore.getItemAsync('SV_DEVICE_ID');
    if (id) return id;
    const trusted = devices?.find((d) => d.isTrusted);
    return trusted?.id ?? '';
  };

  useEffect(() => {
    getActingDeviceId().then((id) => {
      setCurrentDeviceId(id);
      if (onDevicesLoad) {
        onDevicesLoad(devices || [], id);
      }
    });
  }, [devices]);

  const { mutate: removeDeviceMutate } = useMutation({
    mutationFn: async (deviceId: string) => {
      const actingId = await getActingDeviceId();
      const privateKey = await SecureStore.getItemAsync('SV_DEVICE_PRIVATE_KEY');

      const timestamp = Date.now().toString();
      let signature = '';
      if (privateKey && user?.id) {
        const payload = `${user.id}:${deviceId}:REMOVE:${timestamp}`;
        signature = await signDevicePayload(payload, privateKey);
      }

      return http.delete(DEVICE_ENDPOINT.DELETE_DEVICE.replace(':id', deviceId), {
        headers: {
          'X-Device-Id': actingId,
          ...(signature ? { 'X-Device-Signature': signature, 'X-Timestamp': timestamp } : {}),
        },
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
      const privateKey = await SecureStore.getItemAsync('SV_DEVICE_PRIVATE_KEY');

      const timestamp = Date.now().toString();
      let signature = '';
      if (privateKey && user?.id) {
        const payload = `${user.id}:${deviceId}:${isTrusted}:${timestamp}`;
        signature = await signDevicePayload(payload, privateKey);
      }

      return http.put(
        DEVICE_ENDPOINT.PUT_TRUST_DEVICE.replace(':id', deviceId),
        { isTrusted },
        {
          headers: {
            'X-Device-Id': actingId,
            ...(signature ? { 'X-Device-Signature': signature, 'X-Timestamp': timestamp } : {}),
          },
        }
      );
    },
    onSuccess: (data) => {
      console.log(data);
      if (data.success) {
        toast.success(data.message);
        refetchDevices();
        return;
      }
      toast.error(data.message);
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
    <>
      <View className="mb-3 flex-row items-center justify-between px-2">
        <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Trusted Devices
        </Text>
        <TouchableOpacity
          className="items-center justify-center rounded-full bg-zinc-200/50 p-2 active:bg-zinc-200 dark:bg-zinc-800/80 dark:active:bg-zinc-700"
          onPress={() => refetchDevices()}>
          <Ionicons name="reload" size={16} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
        </TouchableOpacity>
      </View>
      <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
        {devices?.length === 0 ? (
          <View className="items-center p-6">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">No devices registered</Text>
          </View>
        ) : (
          devices?.map((device, index) => (
            <View
              key={device.id}
              className={`flex-row items-center p-5 ${
                index < devices.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''
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
                  {device.id === currentDeviceId && ' (This Device)'}
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
    </>
  );
}
