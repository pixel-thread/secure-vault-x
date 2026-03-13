import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { useForm, Controller, SubmitHandler, Control, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { generatePassword } from '@securevault/utils';
import { useColorScheme } from 'nativewind';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import { DeviceStoreManager } from '../../../store/device';
import { encryptData } from '@securevault/crypto';
import * as Crypto from 'expo-crypto';
import { useVaultService } from '@/src/hooks/useVaultService';
import { useSyncService } from '@/src/hooks/useSyncService';
import { logger } from '@securevault/utils-native';

// --- Validation Schema ---
const passwordSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  username: z.string().min(1, 'Username / Email is required'),
  password: z.string().min(1, 'Password is required'),
  note: z.string().optional(),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

type SaveDTO = {
  id: string;
  encryptedData: string;
  iv: string;
};

type Props = {
  onSuccess?: () => void;
};

/**
 * Reusable Form Field Component
 * Simplifies the main form UI by encapsulating label, controller, and error logic.
 */
interface FormFieldProps extends TextInputProps {
  label: string;
  name: keyof PasswordFormValues;
  control: Control<PasswordFormValues>;
  errors: FieldErrors<PasswordFormValues>;
  isDarkMode: boolean;
  extraElement?: React.ReactNode;
}

const FormField = ({
  label,
  name,
  control,
  errors,
  isDarkMode,
  extraElement,
  ...props
}: FormFieldProps) => (
  <View className="mb-4">
    <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      {label}
    </Text>
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <>
          <View className="relative">
            <TextInput
              className={`rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                errors[name] ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
              } ${extraElement ? 'pr-20' : ''}`}
              placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              {...props}
            />
            {extraElement && (
              <View className="absolute bottom-0 right-0 top-0 flex-row items-center pr-2">
                {extraElement}
              </View>
            )}
          </View>
          {errors[name] && (
            <Text className="ml-2 mt-1 text-xs text-red-500">
              {errors[name]?.message as string}
            </Text>
          )}
        </>
      )}
    />
  </View>
);

/**
 * AddPasswordForm Component
 * Handles input for new password items, encryption, and local persistence.
 */
export function AddPasswordForm({ onSuccess }: Props) {
  // --- Initialization & Hooks ---
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const vaultService = useVaultService();
  const syncService = useSyncService();

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

  // --- Persistence Logic ---
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SaveDTO) => {
      logger.info('[AddPasswordForm] Saving vault item to local service', { id: data.id });
      return await vaultService?.saveVaultItem(data);
    },
    onSuccess: () => {
      logger.info('[AddPasswordForm] Successfully saved password to vault');
      toast.success('Password added successfully');
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      onSuccess?.();

      if (syncService) {
        logger.log('[AddPasswordForm] Triggering background sync');
        syncService
          .sync()
          .catch((err) => logger.error('[AddPasswordForm] Background sync failed', { error: err }));
      }
    },
    onError: (error: any) => {
      logger.error('[AddPasswordForm] Failed to save secret', { error: error.message });
      toast.error('Failed to save secret', {
        description: error.message || 'Please try again.',
      });
    },
  });

  /**
   * Main submission handler.
   * Performs encryption using MEK before calling mutation.
   */
  const onSubmitForm: SubmitHandler<PasswordFormValues> = async (data: PasswordFormValues) => {
    logger.info('[AddPasswordForm] Submitting form', {
      service: data.serviceName,
      hasUrl: !!data.url,
      hasNote: !!data.note,
    });

    const mek = await DeviceStoreManager.getMek();
    if (!mek) {
      logger.error('[AddPasswordForm] Encryption Error: MEK not found');
      toast.error('Encryption Error', { description: 'Master Encryption Key not found.' });
      return;
    }

    try {
      logger.log('[AddPasswordForm] Encrypting data...');
      const { encryptedData, iv } = await encryptData(data, mek);
      logger.log('[AddPasswordForm] Encryption successful');

      const id = Crypto.randomUUID();
      mutate({ id, encryptedData, iv });
    } catch (err) {
      logger.error('[AddPasswordForm] Encryption failed', { error: err });
      toast.error('Encryption Failed', { description: 'Could not secure your data.' });
    }
  };

  // --- UI Handlers ---
  const handleRefreshPassword = useCallback(() => {
    const newPass = generatePassword(32);
    logger.log('[AddPasswordForm] Generated new password');
    setValue('password', newPass);
  }, [setValue]);

  // --- Render ---
  return (
    <View>
      <FormField
        label="Service Name"
        name="serviceName"
        control={control}
        errors={errors}
        isDarkMode={isDarkMode}
        placeholder="e.g. Google, Netflix"
      />

      <FormField
        label="Website URL"
        name="url"
        control={control}
        errors={errors}
        isDarkMode={isDarkMode}
        placeholder="https://example.com"
        keyboardType="url"
      />

      <FormField
        label="Username / Email"
        name="username"
        control={control}
        errors={errors}
        isDarkMode={isDarkMode}
        placeholder="john@example.com"
        keyboardType="email-address"
      />

      <FormField
        label="Password"
        name="password"
        control={control}
        errors={errors}
        isDarkMode={isDarkMode}
        placeholder="Password"
        secureTextEntry={!showPassword}
        extraElement={
          <>
            <TouchableOpacity
              className="p-2"
              onPressIn={() => setShowPassword(true)}
              onPressOut={() => setShowPassword(false)}
              delayPressIn={0}>
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={22}
                color={showPassword ? '#10b981' : '#71717a'}
              />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={handleRefreshPassword}>
              <Ionicons name="refresh" size={22} color="#71717a" />
            </TouchableOpacity>
          </>
        }
      />

      <FormField
        label="Note"
        name="note"
        control={control}
        errors={errors}
        isDarkMode={isDarkMode}
        placeholder="Any extra details..."
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={{ minHeight: 100 }}
      />

      <TouchableOpacity
        disabled={isPending}
        className="mt-4 w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
        onPress={handleSubmit(onSubmitForm)}>
        <Ionicons name="save-outline" size={20} color="#022c22" />
        <Text className="ml-2 text-lg font-bold text-[#022c22]">
          {isPending ? 'Saving to Vault...' : 'Save to Vault'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
