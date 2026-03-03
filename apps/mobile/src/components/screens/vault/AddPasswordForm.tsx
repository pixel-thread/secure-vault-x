import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { generatePassword, logger } from '@securevault/utils';
import { useColorScheme } from 'nativewind';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@securevault/utils-native';
import { VAULT_ENDPOINT } from '@securevault/constants';
import { toast } from 'sonner-native';
import { decryptData, encryptData, generateMEK } from '@securevault/crypto';

const passwordSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  username: z.string().min(1, 'Username / Email is required'),
  password: z.string().min(1, 'Password is required'),
  note: z.string().optional(),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

type DTO = {
  encryptedData: string;
};

export function AddPasswordForm() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      serviceName: '',
      url: 'https://',
      username: '',
      password: generatePassword(32),
      note: '',
    },
  });

  const { mutate } = useMutation({
    mutationFn: async (data: DTO) => http.post(VAULT_ENDPOINT.POST_ADD_SECRET, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Secret added successfully', {
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['vault'] });
        return data;
      }

      logger.log('Vault Res', data);
      toast.error('Failed to add secret', {
        description: data.message || 'Please try again.',
      });
      return data;
    },
  });

  const onSubmitForm: SubmitHandler<PasswordFormValues> = async (data: PasswordFormValues) => {
    const mek = await generateMEK();
    const { encryptedData, iv } = await encryptData(JSON.stringify(data), mek);
    logger.log('MEK', mek);
    logger.log('Encrypted', encryptedData);
    const decryptedData = await decryptData(encryptedData, iv, mek);
    logger.log('Decrypted', decryptedData);
    // mutate({ encryptedData: JSON.stringify(encryptedData) });
  };

  return (
    <>
      <View>
        <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Service Name
        </Text>
        <Controller
          control={control}
          name="serviceName"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                className={`rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                  errors.serviceName ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
                placeholder="example name"
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
              />
              {errors.serviceName && (
                <Text className="ml-2 mt-1 text-xs text-red-500">{errors.serviceName.message}</Text>
              )}
            </>
          )}
        />
      </View>
      <View>
        <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Website URL
        </Text>
        <Controller
          control={control}
          name="url"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                className={`rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                  errors.url ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
                placeholder="https://example.com"
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                keyboardType="url"
              />
              {errors.url && (
                <Text className="ml-2 mt-1 text-xs text-red-500">{errors.url.message}</Text>
              )}
            </>
          )}
        />
      </View>
      <View>
        <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Username / Email
        </Text>
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                className={`rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                  errors.username ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
                placeholder="john@example.com"
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
              />
              {errors.username && (
                <Text className="ml-2 mt-1 text-xs text-red-500">{errors.username.message}</Text>
              )}
            </>
          )}
        />
      </View>
      <View>
        <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Password
        </Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
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
                <TouchableOpacity
                  className="p-3"
                  onPress={() => setValue('password', generatePassword(32))}>
                  <Ionicons name="refresh" size={22} color="#71717a" />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="ml-2 mt-1 text-xs text-red-500">{errors.password.message}</Text>
              )}
            </>
          )}
        />
      </View>
      <View>
        <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Note
        </Text>
        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="min-h-[100px] rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-zinc-900 focus:border-emerald-500/50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900"
              placeholder="Any extra details..."
              placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              textAlignVertical="top"
            />
          )}
        />
      </View>
      <TouchableOpacity
        className="mt-2 w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98]"
        onPress={handleSubmit(onSubmitForm)}>
        <Ionicons name="save-outline" size={20} color="#022c22" />
        <Text className="ml-2 text-lg font-bold text-[#022c22]">Save to Vault</Text>
      </TouchableOpacity>
    </>
  );
}
