import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/src/store/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { verifyOtpSchema } from '@securevault/validators';
import { DeviceStoreManager, tokenManager } from '@securevault/libs';
import { useMutation } from '@tanstack/react-query';
import { http, logger } from '@securevault/utils-native';
import { AUTH_ENDPOINT, DEVICE_ENDPOINT } from '@securevault/constants';
import { toast } from 'sonner-native';
import { generateDeviceKeyPair } from '@securevault/crypto';
import { getDeviceIdentifier } from '@/src/utils/deviceId';
import * as Device from 'expo-device';

type FormValue = {
  email: string;
  code: string;
};

type ApiRes = {
  accessToken: string;
  refreshToken: string;
};

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
    onSuccess: async (data: any) => {
      if (data.success) {
        const loginData = data?.data as any;
        if (loginData?.refreshToken && loginData?.accessToken) {
          await tokenManager.setBothTokens(loginData?.accessToken, loginData?.refreshToken);

          // Generate Device KeyPair and Register Device
          try {
            const keyPair = await generateDeviceKeyPair();
            // await SecureStore.setItemAsync('SV_DEVICE_PRIVATE_KEY', keyPair.privateKey);
            await DeviceStoreManager.setDevicePrivateKey(keyPair.privateKey);

            const dName =
              Device.deviceName ||
              `${Device.modelName || 'SecureVault Mobile'} (${Device.osName || 'Unknown OS'})`;

            const devId = await getDeviceIdentifier();
            const res = await http.post<any>(DEVICE_ENDPOINT.POST_REGISTER_DEVICE, {
              deviceName: dName,
              deviceIdentifier: devId,
              publicKey: keyPair.publicKey,
            });

            if (res.data?.id) {
              logger.log('[MFA] Registration successful. Device UUID:', res.data.id);
              // await SecureStore.setItemAsync('SV_DEVICE_ID', res.data.id);
              await DeviceStoreManager.setDeviceId(res.data.id);
              // await SecureStore.setItemAsync('SV_DEVICE_ID_RESERVE', devId); // Store hardware ID as reserve
              await DeviceStoreManager.setDeviceIdReserve(devId);
            } else {
              logger.warn('[MFA] Device registration response missing ID:', res.data);
            }

            // ONLY AFTER registration finishes, we proceed
            setIsAuthenticated(true);
            toast.success('Authentication Complete', {
              description: 'You have been successfully verified.',
            });
            router.replace('/(drawer)/(tabs)');
          } catch (err) {
            logger.warn('Could not register device automatically upon MFA login:', err);
            // Even if device registration fails, we might still want to let them in,
            // but they won't be able to manage devices until they re-enroll.
            setIsAuthenticated(true);
            router.replace('/(drawer)/(tabs)');
          }
        }
        return data.data;
      } else {
        toast.error('Verification Failed', {
          description: (data as any).message || 'Invalid code.',
        });
        return data as any;
      }
    },
    onError: (err: any) => {
      toast.error('Verification Failed', {
        description: err?.response?.data?.message || 'An unexpected error occurred.',
      });
    },
  });

  const onSubmit = async (data: FormValue) => mutate(data);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 items-center justify-center bg-white p-8 dark:bg-[#09090b]">
        <View className="mb-12 items-center">
          <View className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-lg shadow-emerald-500/20 dark:bg-emerald-500/10">
            <Ionicons name="keypad" size={48} color="#10b981" />
          </View>
          <Text className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
            Two-Factor Auth
          </Text>
          <Text className="mt-3 text-center text-base font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Enter the 6-digit code sent to your email or generated by your Trusted Device.
          </Text>
        </View>

        <View className="w-full max-w-sm gap-y-4">
          <View>
            <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`w-full rounded-2xl border bg-zinc-50 px-5 py-4 text-lg text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                    errors.email
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-200 focus:border-emerald-500/50 dark:border-zinc-800'
                  }`}
                  placeholder="Email Address"
                  placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  editable={false}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              )}
            />
            {errors.email && (
              <Text className="ml-1 mt-1 text-sm text-red-500">{errors.email.message}</Text>
            )}
          </View>

          <View>
            <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Verification Code
            </Text>
            <Controller
              control={control}
              name="code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`w-full rounded-2xl border bg-zinc-50 px-5 py-4 text-center font-mono text-3xl font-bold tracking-[1em] text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                    errors.code
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-200 focus:border-emerald-500/50 dark:border-zinc-800'
                  }`}
                  placeholder="------"
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
              <Text className="ml-1 mt-1 text-sm text-red-500">{errors.code.message}</Text>
            )}
          </View>

          <TouchableOpacity
            className="mt-4 w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 transition-transform active:scale-[0.98] active:bg-emerald-600"
            disabled={isPending}
            onPress={handleSubmit(onSubmit)}>
            <Ionicons name="shield-checkmark" size={24} color="#064e3b" />
            <Text className="ml-2 text-lg font-bold text-[#022c22]">Verify Code</Text>
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center">
            <TouchableOpacity onPress={() => router.replace('/auth')}>
              <Text className="font-bold text-zinc-500 dark:text-zinc-400">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
