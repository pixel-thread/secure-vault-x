import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { http } from '@securevault/utils-native';
import { toast } from 'sonner-native';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from 'nativewind';

interface PendingOtp {
  id: string;
  code: string;
  expiresAt: string;
  createdAt: string;
}

export default function PendingOtpsSection({
  isCurrentDeviceTrusted,
}: {
  isCurrentDeviceTrusted: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const {
    data: pendingOtps = [],
    refetch: refetchPendingOtps,
    isFetching,
  } = useQuery({
    queryKey: ['pendingOtps'],
    queryFn: async () => http.get<PendingOtp[]>(AUTH_ENDPOINT.GET_MFA_PENDING),
    enabled: !!isCurrentDeviceTrusted,
    select: (data) => data.data,
  });

  const { mutate: revokeOtpMutate } = useMutation({
    mutationFn: (otpId: string) => http.post(AUTH_ENDPOINT.POST_MFA_REVOKE, { otpId }),
    onSuccess: () => {
      toast.success('OTP revoked successfully');
      refetchPendingOtps();
    },
    onError: () => toast.error('Failed to revoke OTP'),
  });

  return (
    <View className="mb-8">
      <View className="mb-3 flex-row items-center justify-between px-2">
        <Text className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Pending OTP Notification
        </Text>
        <TouchableOpacity
          className="items-center justify-center rounded-full bg-zinc-200/50 p-2 active:bg-zinc-200 dark:bg-zinc-800/80 dark:active:bg-zinc-700"
          onPress={() => refetchPendingOtps()}>
          <Ionicons name="reload" size={16} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
        </TouchableOpacity>
      </View>
      <View className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
        {!pendingOtps || pendingOtps.length === 0 ? (
          <View className="items-center p-6">
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              {isFetching ? 'Loading...' : 'No pending OTPs'}
            </Text>
          </View>
        ) : (
          pendingOtps.map((otp, index) => (
            <View
              key={otp.id}
              className={`flex-row items-center p-5 ${
                index > 0 ? 'border-t border-zinc-100 dark:border-zinc-800/50' : ''
              }`}>
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
                <Ionicons
                  name="keypad-outline"
                  size={22}
                  color={isDarkMode ? '#3b82f6' : '#2563eb'}
                />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                  Login Request
                </Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                  Code:{' '}
                  <Text className="font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400">
                    {otp.code}
                  </Text>
                </Text>
              </View>
              <TouchableOpacity
                className="ml-2 h-10 items-center justify-center rounded-xl bg-zinc-200 px-4 active:bg-zinc-300 dark:bg-zinc-800/80 dark:active:bg-zinc-700"
                onPress={() => {
                  Clipboard.setStringAsync(otp.code);
                  toast.success('Code copied entirely');
                }}>
                <Text className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="ml-2 h-10 items-center justify-center rounded-xl bg-red-100 px-4 active:bg-red-200 dark:bg-red-500/10 dark:active:bg-red-500/20"
                onPress={() => {
                  Alert.alert('Revoke OTP', `Are you sure you want to revoke this login request?`, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Revoke',
                      style: 'destructive',
                      onPress: () => revokeOtpMutate(otp.id),
                    },
                  ]);
                }}>
                <Text className="text-sm font-bold text-red-600 dark:text-red-500">Revoke</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
