import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../../store/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordLoginSchema } from '@securevault/validators';
import { tokenManager } from '@securevault/libs';
import { useMutation } from '@tanstack/react-query';
import { http } from '@securevault/utils-native';
import { AUTH_ENDPOINT, DEVICE_ENDPOINT } from '@securevault/constants';
import { toast } from 'sonner-native';
import { generateDeviceKeyPair } from '@securevault/crypto';
import { getDeviceIdentifier } from '../../../utils/deviceId';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { logger } from '@securevault/utils';
import { useState } from 'react';

type FormValue = {
  email: string;
  password: string;
};

type ApiRes = {
  accessToken: string;
  refreshToken: string;
};

export default function LoginScreen() {
  const { setIsAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValue>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      email: process.env.EMAIL || '',
      password: process.env.PASSWORD || '',
    },
  });

  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValue) => http.post<ApiRes>(AUTH_ENDPOINT.POST_PASSWORD_LOGIN, data),
    onSuccess: async (data: any) => {
      if (data.success) {
        const loginData = data?.data as any;

        // NEW: Check if MFA is required before extracting tokens
        if (loginData?.requiresMfa) {
          toast.info('Two-Factor Authentication', {
            description: loginData.message || 'OTP code sent to email.',
          });
          router.push({ pathname: '/auth/mfa', params: { email: control._formValues.email } });
          return;
        }

        if (loginData?.refreshToken && loginData?.accessToken) {
          await tokenManager.setBothTokens(loginData?.accessToken, loginData?.refreshToken);

          // Generate Device KeyPair and Register Device
          try {
            const keyPair = await generateDeviceKeyPair();
            await SecureStore.setItemAsync('SV_DEVICE_PRIVATE_KEY', keyPair.privateKey);

            // Wait for tokens to be flushed to avoid unauth error
            const dName =
              Device.deviceName ||
              `${Device.modelName || 'SecureVault Mobile'} (${Device.osName || 'Unknown OS'})`;
            const devId = await getDeviceIdentifier();
            const res = await http.post<{ id: string }>(DEVICE_ENDPOINT.POST_REGISTER_DEVICE, {
              deviceName: dName,
              deviceIdentifier: devId,
              publicKey: keyPair.publicKey,
            });

            if (res.data?.id) {
              logger.log('[Login] Registration successful. Device UUID:', res.data.id);
              await SecureStore.setItemAsync('SV_DEVICE_ID', res.data.id);
              await SecureStore.setItemAsync('SV_DEVICE_ID_RESERVE', devId); // Store hardware ID as reserve
            }
          } catch (err) {
            logger.warn('Could not register device automatically upon login:', err);
          }

          setIsAuthenticated(true);
          toast.success('Welcome back!', {
            description: 'You have been successfully logged in.',
          });
          router.replace('/(drawer)/(tabs)');
        }
        return data.data;
      } else {
        toast.error('Login Failed', {
          description: (data as any).message || 'Please check your credentials.',
        });
        return data as any;
      }
    },
  });

  const onSubmit = async (data: FormValue) => {
    try {
      mutate(data);
    } catch (err: any) {
      toast.error('Authentication Failed', {
        description: err?.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white p-8 dark:bg-[#09090b]">
      <View className="mb-12 items-center">
        <View className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-lg shadow-emerald-500/20 dark:bg-emerald-500/10">
          <Ionicons name="shield-checkmark" size={48} color="#10b981" />
        </View>
        <Text className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
          SecureVault <Text className="text-emerald-500">X</Text>
        </Text>
        <Text className="mt-3 text-center text-base font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          Military-grade encryption for your digital life.
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
            Password
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center rounded-2xl border bg-zinc-50 pr-2 dark:bg-zinc-900/50 ${
                  errors.password ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}>
                <TextInput
                  className="flex-1 px-5 py-4 text-zinc-900 focus:bg-white dark:text-white dark:focus:bg-zinc-900/10"
                  placeholder="Password"
                  placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  className="p-3"
                  onPressIn={() => setShowPassword(true)}
                  onPressOut={() => setShowPassword(false)}
                  delayPressIn={0}>
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color={showPassword ? '#10b981' : '#71717a'}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && (
            <Text className="ml-1 mt-1 text-sm text-red-500">{errors.password.message}</Text>
          )}
        </View>

        <TouchableOpacity
          className="mt-4 w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 transition-transform active:scale-[0.98] active:bg-emerald-600 disabled:opacity-50"
          disabled={isPending}
          onPress={handleSubmit(onSubmit)}>
          <Ionicons name="log-in" size={24} color="#064e3b" />
          <Text className="ml-2 text-lg font-bold text-[#022c22]">
            {isPending ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-zinc-500 dark:text-zinc-400">Don&apos;t have an account? </Text>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity>
              <Text className="font-bold text-emerald-600 dark:text-emerald-500">Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
