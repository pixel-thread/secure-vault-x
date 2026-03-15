import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useVaultService } from '@/src/hooks/useVaultService';
import { useSyncService } from '@/src/hooks/useSyncService';
import { DeviceStoreManager } from '../../../store/device';
import { encryptData } from '@securevault/crypto';
import * as Crypto from 'expo-crypto';
import { toast } from 'sonner-native';

const cardSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  cardName: z.string().min(1, 'Cardholder name is required'),
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d{12,19}$/, 'Invalid card number format'),
  exp: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY format'),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),
  note: z.string().optional(),
});

type CardFormValues = z.infer<typeof cardSchema>;

type SaveDTO = {
  id: string;
  encryptedData: string;
  iv: string;
};

interface Props {
  onSuccess?: () => void;
}

export function AddBankCardForm({ onSuccess }: Props) {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const vaultService = useVaultService();
  const syncService = useSyncService();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { serviceName: '', cardName: '', cardNumber: '', exp: '', cvv: '', note: '' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: SaveDTO) => {
      if (!vaultService) throw new Error('Vault Service not initialized');
      return await vaultService.saveVaultItem(data);
    },
    onSuccess: () => {
      toast.success('Card added locally');
      queryClient.invalidateQueries({ queryKey: ['vault'] });
      onSuccess?.();

      // Trigger background sync
      if (syncService) {
        syncService.sync();
      }
    },
    onError: (error: any) => {
      toast.error('Failed to save card locally', {
        description: error.message || 'Please try again.',
      });
    },
  });

  const onSubmitForm = async (data: CardFormValues) => {
    const mek = await DeviceStoreManager.getMek();
    if (!mek) {
      toast.error('Encryption Error', { description: 'Master Encryption Key not found.' });
      return;
    }
    const { encryptedData, iv } = await encryptData(data, mek);
    const id = Crypto.randomUUID();
    mutate({ id, encryptedData, iv });
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
                placeholder="e.g. Chase Bank"
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
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
          Cardholder Name
        </Text>
        <Controller
          control={control}
          name="cardName"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                className={`rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                  errors.cardName ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
                placeholder="John Doe"
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
              />
              {errors.cardName && (
                <Text className="ml-2 mt-1 text-xs text-red-500">{errors.cardName.message}</Text>
              )}
            </>
          )}
        />
      </View>
      <View>
        <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Card Number
        </Text>
        <Controller
          control={control}
          name="cardNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                className={`rounded-2xl border bg-zinc-50 px-5 py-4 font-mono text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                  errors.cardNumber ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}
                placeholder="4111 2222 3333 4444"
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="number-pad"
              />
              {errors.cardNumber && (
                <Text className="ml-2 mt-1 text-xs text-red-500">{errors.cardNumber.message}</Text>
              )}
            </>
          )}
        />
      </View>
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Expires
          </Text>
          <Controller
            control={control}
            name="exp"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  className={`rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                    errors.exp ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  placeholder="MM/YY"
                  placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numbers-and-punctuation"
                />
                {errors.exp && (
                  <Text className="ml-1 mt-1 text-xs text-red-500">{errors.exp.message}</Text>
                )}
              </>
            )}
          />
        </View>
        <View className="flex-1">
          <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            CVV
          </Text>
          <Controller
            control={control}
            name="cvv"
            render={({ field: { onChange, onBlur, value } }) => (
              <>
                <TextInput
                  className={`rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                    errors.cvv ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                  placeholder="123"
                  placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  secureTextEntry
                />
                {errors.cvv && (
                  <Text className="ml-1 mt-1 text-xs text-red-500">{errors.cvv.message}</Text>
                )}
              </>
            )}
          />
        </View>
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
