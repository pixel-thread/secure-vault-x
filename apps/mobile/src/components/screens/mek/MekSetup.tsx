import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@store/auth';
import { useMutation } from '@tanstack/react-query';
import { http, logger } from '@securevault/utils-native';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { generateMEK } from '@securevault/crypto';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useColorScheme } from 'nativewind';
import { passwordLoginSchema } from '@securevault/validators';
import { useForm, Controller } from 'react-hook-form';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Container } from '@securevault/ui-native';
import { ScreenContainer } from '@src/components/common/ScreenContainer';
import Header from '@src/components/common/Header';

const schema = passwordLoginSchema.pick({ password: true });

type PasswordFormValues = z.infer<typeof schema>;

/**
 * Screen for setting up the Master Encryption Key (MEK).
 * Encapsulates the core zero-knowledge setup flow with a modern aesthetic.
 */
export default function MekSetup() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
    },
  });

  const password = watch('password');

  const [showPassword, setShowPassword] = useState(false);
  const { setHasMek } = useAuthStore();

  const { mutate: getSalt, isPending: isGettingSalt } = useMutation({
    mutationFn: () => http.get<{ salt: string | null }>(AUTH_ENDPOINT.GET_ENCRYPTION_SALT),
  });

  const { mutate: setSalt, isPending: isSettingSalt } = useMutation({
    mutationFn: (salt: string) =>
      http.post<{ salt: string }>(AUTH_ENDPOINT.POST_ENCRYPTION_SALT, { salt }),
  });

  const isLoading = isGettingSalt || isSettingSalt;

  const onHandleSetup = (data: PasswordFormValues) => {
    getSalt(undefined, {
      onSuccess: async (saltData) => {
        try {
          let currentSalt = saltData?.data?.salt;
          let mekData: { mek: string; salt: string };

          if (currentSalt) {
            // Salt exists, derive MEK
            mekData = await generateMEK(data.password, currentSalt);
            finishSetup(mekData.mek);
          } else {
            // Generates new MEK and a new salt
            mekData = await generateMEK(data.password);

            // Save the new salt to the backend
            setSalt(mekData.salt, {
              onSuccess: () => {
                finishSetup(mekData.mek);
              },
              onError: (error) => {
                logger.error('Failed to save salt to backend', error);
                toast.error('Setup Failed', { description: 'Could not save encryption settings.' });
              },
            });
          }
        } catch (error) {
          logger.error('MEK Generation Error', error instanceof Error ? error.message : error);
          toast.error('Setup Failed', {
            description: 'An error occurred during encryption setup.',
          });
        }
      },
      onError: (error) => {
        logger.error('Failed to get salt', error);
        toast.error('Setup Failed', { description: 'Could not retrieve encryption settings.' });
      },
    });
  };

  const finishSetup = async (mek: string) => {
    try {
      await SecureStore.setItemAsync('SV_MEK', mek);
      setHasMek(true);
      toast.success('Key Forged!', { description: 'Your Vault is now officially unbreakable.' });
    } catch (error) {
      logger.error('Failed to save MEK locally', error);
      toast.error('Setup Failed', { description: 'Could not store encryption key securely.' });
    }
  };

  return (
    <Container>
      <ScreenContainer>
        <Header title="The Forge" subtitle="Let's lock it down" isSyncing={isLoading} />
        <View className="flex-1 px-6 pt-12">
          <View className="items-center mb-10">
            <View className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-lg shadow-emerald-500/10">
              <Ionicons name="shield-checkmark-outline" size={56} color="#10b981" />
            </View>
            <Text className="text-center text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400 px-4">
              Your vault is protected by a Master Encryption Key (MEK) forged from your Master Password. We never store this key — only you have the access.
            </Text>
          </View>

          <View className="w-full gap-y-6">
            <View className="gap-y-3">
              <Text className="ml-1 text-sm font-bold uppercase tracking-widest text-zinc-400">
                The Master Key
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`flex-row items-center rounded-2xl border bg-zinc-50/50 pr-2 dark:bg-zinc-900/30 ${
                      errors.password ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'
                    }`}>
                    <TextInput
                      className="flex-1 px-5 py-4 text-zinc-900 focus:bg-white dark:text-white dark:focus:bg-zinc-900/10"
                      placeholder="Enter your Master Password"
                      placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
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
                <Text className="ml-1 text-sm font-medium text-rose-500">{errors.password.message}</Text>
              )}
            </View>

            <TouchableOpacity
              className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
              onPress={handleSubmit(onHandleSetup)}
              disabled={isLoading || password.length < 8}>
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={20} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">Forge the Key</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50/30 p-5 dark:border-zinc-800 dark:bg-zinc-900/20">
              <Text className="text-center text-xs font-medium italic leading-5 text-zinc-500 dark:text-zinc-400">
                <Text className="font-bold text-zinc-900 dark:text-white">Heads up:</Text> We never store or see your password. It's used to forge your unique MEK. If you lose this password, your vault is gone forever. Keep it on lock.
              </Text>
            </View>
          </View>
        </View>
      </ScreenContainer>
    </Container>
  );
}

