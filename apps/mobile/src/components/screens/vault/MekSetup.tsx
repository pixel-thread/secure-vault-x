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
const schema = passwordLoginSchema.pick({ password: true });

type PasswordFormValues = z.infer<typeof schema>;

export function MekSetup() {
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
      toast.success('Encryption Setup Complete', { description: 'Your Vault is now secure.' });
    } catch (error) {
      logger.error('Failed to save MEK locally', error);
      toast.error('Setup Failed', { description: 'Could not store encryption key securely.' });
    }
  };

  return (
    <View className="flex-1 items-center justify-center gap-y-8 bg-white px-6 dark:bg-[#09090b]">
      <View className="items-center gap-y-4">
        <View className="items-center justify-center rounded-full bg-emerald-100 p-6 dark:bg-emerald-900/30">
          <Ionicons name="lock-closed" size={48} color="#10b981" />
        </View>
        <Text className="text-center text-2xl font-bold text-black dark:text-white">
          Vault Encryption Setup
        </Text>
        <Text className="text-center text-base text-zinc-500 dark:text-zinc-400">
          Your vault is protected by a Master Encryption Key (MEK) derived from your Master
          Password. Enter your Master Password below to unlock or setup your vault.
        </Text>
      </View>

      <View className="w-full gap-y-4">
        <View className="gap-y-2">
          <Text className="ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Master Password
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
                  className="flex-1 px-5 py-4 text-black focus:bg-white dark:text-white dark:focus:bg-zinc-900/10"
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
            <Text className="ml-1 mt-1 text-sm text-red-500">{errors.password.message}</Text>
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
              <Ionicons name="key" size={20} color="#ffffff" />
              <Text className="ml-2 text-lg font-bold text-white">Generate MEK</Text>
            </>
          )}
        </TouchableOpacity>

        <View className="px-4 text-center">
          <Text className="text-center text-xs italic text-zinc-500 dark:text-zinc-400">
            Your **Master Password** secures your vault. We never store or see it. It is used to
            generate your encryption key. If you lose your device, you will need this password to
            recover your vault. Keep it safe.
          </Text>
        </View>
      </View>
    </View>
  );
}
