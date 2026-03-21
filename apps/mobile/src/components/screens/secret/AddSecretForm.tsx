import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { encryptData } from '@securevault/crypto';
import { SecretTemplate, SecretField } from '@securevault/types';
import { getSecretSchema } from '@securevault/validators';
import { logger } from '@securevault/utils-native';
import { FormField } from '@src/components/common/FormField';
import { DeviceStoreManager } from '@store/device';
import { getSecretDefaults } from '@utils/helper/secret';
import { usePasswordMutation, MutationMode } from '@hooks/usePasswordMutation';
import * as Crypto from 'expo-crypto';
import { useColorScheme } from 'nativewind';
import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { View, Text, TouchableOpacity } from 'react-native';
import { toast } from 'sonner-native';

interface Props {
  template: SecretTemplate;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: MutationMode;
  initialValues?: any;
}

/**
 * A dynamic form component for adding or editing secrets.
 * Uses type-specific templates to render fields and handles client-side encryption.
 */
export function AddSecretForm({
  template,
  onSuccess,
  onCancel,
  mode = 'create',
  initialValues,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // --- STATE ---
  const [showMasked, setShowMasked] = useState<Record<string, boolean>>({});

  // --- FORM SETUP ---
  
  // Initialize default values based on template and mode (create/edit)
  const defaultValues = useMemo(
    () => getSecretDefaults(template, mode, initialValues),
    [mode, initialValues, template]
  );

  const { control, handleSubmit, formState: { errors } } = useForm<any>({
    defaultValues,
    resolver: zodResolver(getSecretSchema(template.type)),
  });

  const { mutate, isPending } = usePasswordMutation(mode, onSuccess);

  // --- HANDLERS ---

  /**
   * Processes form submission: builds the secret object, encrypts it using MEK,
   * and triggers the mutation to save it to the vault.
   */
  const onSubmitForm = async (values: any) => {
    // 1. Retrieve Master Encryption Key (MEK) for zero-knowledge encryption
    const mek = await DeviceStoreManager.getMek();
    if (!mek) {
      toast.error('MEK is missing, hold up.', { 
        description: 'Master Encryption Key not found.' 
      });
      return;
    }

    try {
      // 2. Map form values to the structured SecretField format
      const secretFields: SecretField[] = template.fields.map((f) => ({
        id: Crypto.randomUUID(),
        label: f.label,
        type: f.type,
        value: values[f.label],
        masked: f.masked,
        copyable: f.copyable,
      }));

      // 3. Construct the full Secret payload
      const secretPayload = {
        id: mode === 'edit' && initialValues?.id ? initialValues.id : Crypto.randomUUID(),
        title: values.title || template.label,
        type: template.type,
        fields: secretFields,
        note: values.note,
        meta: {
          createdAt: initialValues?.meta?.createdAt || Date.now(),
          updatedAt: Date.now(),
        },
      };

      // 4. Encrypt the data locally (Zero-Knowledge) before sending to the server
      const { encryptedData, iv } = await encryptData(secretPayload, mek);
      mutate({ id: secretPayload.id, encryptedData, iv });
    } catch (err) {
      logger.error('[AddSecretForm] Submission failed', { error: err });
      toast.error("Darn, couldn't save that.", { 
        description: 'Could not secure your data.' 
      });
    }
  };

  const toggleMask = (label: string) => {
    setShowMasked((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  /**
   * Helper to resolve a friendly placeholder based on the field label.
   */
  const getPlaceholder = (label: string): string => {
    const l = label.toLowerCase();
    if (l.includes('username')) return 'Your unique handle...';
    if (l.includes('password')) return 'Make it a banger...';
    if (l.includes('url')) return 'https://vibe-check.com';
    if (l.includes('card number')) return '0000 0000 0000 0000';
    if (l.includes('cardholder')) return 'Name on the plastic...';
    if (l.includes('expiry')) return 'MM/YY';
    if (l.includes('cvv')) return 'The magic 3 digits...';
    if (l.includes('api key')) return 'Paste your token here...';
    if (l.includes('service')) return 'Which app is this?';
    if (l.includes('address')) return 'Wallet address here...';
    if (l.includes('seed')) return 'The secret words...';
    if (l.includes('id number')) return 'The government digits...';
    if (l.includes('content')) return 'Spill the beans...';
    return `Enter your ${l}...`;
  };

  // --- RENDER ---
  return (
    <View className="flex-1">
      {/* Primary Secret Name */}
      <FormField
        label="Name it"
        name="title"
        control={control}
        errors={errors}
        isDarkMode={isDarkMode}
        placeholder="My super secret stash..."
      />

      {/* Template-Defined Dynamic Fields */}
      {template.fields.map((field) => (
        <FormField
          key={field.label}
          label={field.label}
          name={field.label}
          control={control}
          errors={errors}
          isDarkMode={isDarkMode}
          placeholder={getPlaceholder(field.label)}
          secureTextEntry={field.masked && !showMasked[field.label]}
          keyboardType={
            field.type === 'url' ? 'url' : field.type === 'number' ? 'numeric' : 'default'
          }
          multiline={field.type === 'multiline'}
          numberOfLines={field.type === 'multiline' ? 4 : 1}
          extraElement={
            field.masked ? (
              <TouchableOpacity onPress={() => toggleMask(field.label)} className="p-2">
                <Ionicons
                  name={showMasked[field.label] ? 'eye' : 'eye-off'}
                  size={22}
                  color={showMasked[field.label] ? '#10b981' : '#71717a'}
                />
              </TouchableOpacity>
            ) : null
          }
        />
      ))}

      {/* Optional Note Field */}
      <FormField
        label="Extra Deets"
        name="note"
        control={control}
        errors={errors}
        isDarkMode={isDarkMode}
        placeholder="Drop the tea here..."
        multiline={true}
        numberOfLines={4}
      />


      {/* Action Buttons */}
      <View className="mt-6 gap-3">
        <TouchableOpacity
          disabled={isPending}
          className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
          onPress={handleSubmit(onSubmitForm)}>
          <Ionicons name="save-outline" size={20} color="#022c22" />
          <Text className="ml-2 text-lg font-bold text-[#022c22]">
            {isPending ? 'Stashing...' : 'Lock it in'}
          </Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity 
            onPress={onCancel} 
            className="w-full flex-row items-center justify-center rounded-2xl border border-zinc-200 bg-white py-4 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900/50">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">Abort mission</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

