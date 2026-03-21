import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@store/auth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordLoginSchema } from '@securevault/validators';
import { tokenManager, DeviceStoreManager } from '@securevault/libs';
import { useMutation } from '@tanstack/react-query';
import { http, logger } from '@securevault/utils-native';
import { AUTH_ENDPOINT, DEVICE_ENDPOINT } from '@securevault/constants';
import { toast } from 'sonner-native';
import { generateDeviceKeyPair } from '@securevault/crypto';
import { getDeviceIdentifier } from '@utils/deviceId';
import * as Device from 'expo-device';
import { useState } from 'react';
import { Container } from '@securevault/ui-native';
import { ScreenContainer } from '@src/components/common/ScreenContainer';

type FormValue = {
  email: string;
  password: string;
};

type ApiRes = {
  accessToken: string;
  refreshToken: string;
  requiresMfa: boolean;
};

/**
 * Renders the login screen with email/password authentication.
 */
export default function LoginScreen() {
  const { setIsAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValue>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      email: isDev ? 'one@gmail.com' : '',
      password: isDev ? '123Clashofclan@' : '',
    },
  });

  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValue) => http.post<ApiRes>(AUTH_ENDPOINT.POST_PASSWORD_LOGIN, data),
    onSuccess: async (data) => {
      if (data.success) {
        const loginData = data?.data;
        if (loginData?.requiresMfa) {
          toast.info('Security Check', {
            description: 'Check your email for the magic code.',
          });
          router.push({ pathname: '/auth/mfa', params: { email: control._formValues.email } });
          return;
        }

        if (loginData?.refreshToken && loginData?.accessToken) {
          await tokenManager.setBothTokens(loginData.accessToken, loginData.refreshToken);

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
            logger.warn('Device registration failed:', err);
          }

          setIsAuthenticated(true);
          toast.success('Welcome back!', {
            description: 'The vibe is immaculate.',
          });
          router.replace('/(drawer)/(tabs)');
        }
      } else {
        toast.error('Oof, Login failed', {
          description: (data as any).message || 'Check your handle or the key.',
        });
      }
    },
  });

  const onSubmit = (data: FormValue) => mutate(data);

  return (
    <Container>
      <ScreenContainer>
        <View className="flex-1 items-center justify-center p-8">
          <View className="mb-12 items-center">
            <View className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-2 shadow-lg shadow-emerald-500/20">
              <Image
                source={require('../../../../assets/icon.png')}
                style={{ width: 100, height: 100 }}
                className="rounded-2xl"
              />
            </View>
            <Text className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
              SecureVault <Text className="text-emerald-500">X</Text>
            </Text>
            <Text className="mt-3 text-center text-base font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
              Unbreakable Vibe. High Octane Security.
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
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`w-full rounded-2xl border bg-zinc-50 px-5 py-4 text-lg text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                      errors.email ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                    placeholder="Email address..."
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
                The Key
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
                      className="flex-1 px-5 py-4 text-lg text-zinc-900 dark:text-white"
                      placeholder="The secret word..."
                      placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPressIn={() => setShowPassword(true)}
                      onPressOut={() => setShowPassword(false)}
                      className="p-3">
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
              className="mt-4 w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
              disabled={isPending}
              onPress={handleSubmit(onSubmit)}>
              <Ionicons name="log-in-outline" size={24} color="#064e3b" />
              <Text className="ml-2 text-xl font-bold text-[#022c22]">
                {isPending ? 'Checking Vibe...' : "Let's Go"}
              </Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-zinc-500 dark:text-zinc-400">No account yet? </Text>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity>
                  <Text className="font-bold text-emerald-600 dark:text-emerald-500">
                    Join the Crew
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScreenContainer>
    </Container>
  );
}
