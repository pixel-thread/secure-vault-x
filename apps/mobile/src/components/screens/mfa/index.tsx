import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@store/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifyOtpSchema } from '@securevault/validators';
import { DeviceStoreManager, tokenManager } from '@securevault/libs';
import { useMutation } from '@tanstack/react-query';
import { http, logger } from '@securevault/utils-native';
import { AUTH_ENDPOINT, DEVICE_ENDPOINT } from '@securevault/constants';
import { toast } from 'sonner-native';
import { generateDeviceKeyPair } from '@securevault/crypto';
import { getDeviceIdentifier } from '@utils/deviceId';
import * as Device from 'expo-device';
import { Container } from '@securevault/ui-native';
import { ScreenContainer } from '@src/components/common/ScreenContainer';

type FormValue = {
  email: string;
  code: string;
};

type ApiRes = {
  accessToken: string;
  refreshToken: string;
};

/**
 * MFA Screen for 2FA verification.
 */
export default function MfaScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setIsAuthenticated } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValue>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: email || '',
      code: '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValue) => http.post<ApiRes>(AUTH_ENDPOINT.POST_MFA_VERIFY, data),
    onSuccess: async (data: { success: boolean; data?: ApiRes; message?: string }) => {
      if (data.success) {
        const loginData = data?.data;
        if (loginData?.refreshToken && loginData?.accessToken) {
          await tokenManager.setBothTokens(loginData?.accessToken, loginData?.refreshToken);

          try {
            const keyPair = await generateDeviceKeyPair();
            await DeviceStoreManager.setDevicePrivateKey(keyPair.privateKey);

            const dName = Device.deviceName || `${Device.modelName || 'SecureVault Mobile'}`;
            const devId = await getDeviceIdentifier();
            const res = await http.post<{ id: string }>(DEVICE_ENDPOINT.POST_REGISTER_DEVICE, {
              deviceName: dName,
              deviceIdentifier: devId,
              publicKey: keyPair.publicKey,
            });

            if (res.data?.id) {
              await DeviceStoreManager.setDeviceId(res.data.id);
              await DeviceStoreManager.setDeviceIdReserve(devId);
            }
          } catch (err) {
            logger.warn('MFA device registration failed:', err);
          }

          setIsAuthenticated(true);
          toast.success('you r in', {
            description: 'The stash is open.',
          });
          router.replace('/(drawer)/(tabs)');
        }
        return data.data;
      } else {
        toast.error('Major L', {
          description: data.message || 'Invalid code, try again.',
        });
        return data.data;
      }
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'The vibes are off.';
      toast.error('Major L', {
        description: message,
      });
    },
  });

  const onSubmit = (data: FormValue) => mutate(data);

  return (
    <Container>
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-8">
          <View className="flex-1 items-center justify-center">
            <View className="mb-12 items-center">
              <View className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-lg shadow-emerald-500/20">
                <Ionicons name="shield-checkmark-outline" size={48} color="#10b981" />
              </View>
              <Text className="text-center text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
                Security Check
              </Text>
              <Text className="mt-3 text-center text-base font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                Drop the magic code from your email to unlock the stash.
              </Text>
            </View>

            <View className="w-full max-w-sm gap-y-4">
              <View>
                <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Your handle
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { value } }) => (
                    <TextInput
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 px-5 py-4 text-lg text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400"
                      value={value}
                      editable={false}
                    />
                  )}
                />
              </View>

              <View>
                <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  The Code
                </Text>
                <Controller
                  control={control}
                  name="code"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`w-full rounded-2xl border bg-zinc-50 px-5 py-4 text-center font-mono text-3xl font-bold tracking-[0.5em] text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                        errors.code ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                      placeholder="000000"
                      placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      maxLength={6}
                      keyboardType="number-pad"
                    />
                  )}
                />
                {errors.code && (
                  <Text className="ml-1 mt-1 text-center text-sm text-red-500">
                    {errors.code.message}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                className="mt-4 w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
                disabled={isPending}
                onPress={handleSubmit(onSubmit)}
              >
                <Ionicons name="lock-open-outline" size={24} color="#064e3b" />
                <Text className="ml-2 text-xl font-bold text-[#022c22]">Unlock</Text>
              </TouchableOpacity>

              <View className="mt-6 flex-row justify-center">
                <TouchableOpacity onPress={() => router.replace('/auth')}>
                  <Text className="text-lg font-bold text-zinc-500 dark:text-zinc-400">
                    Wait, go back
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
}
