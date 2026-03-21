import { Ionicons } from '@expo/vector-icons';
import { SecretTemplate } from '@securevault/types';
import { FormField } from '@src/components/common/FormField';
import { usePasswordMutation } from '@hooks/usePasswordMutation';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { toast } from 'sonner-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { fileSchema } from '@securevault/validators';
import { useFileEncrypter } from '@hooks/useFileEncrypter';
import { MAX_FILE_SIZE_MB } from '@securevault/constants';

interface Props {
  /** Template definition for the secret */
  template: SecretTemplate;
  /** Callback on successful creation */
  onSuccess?: () => void;
  /** Callback to go back */
  onCancel?: () => void;
}


/**
 * ============================================================================
 * ADD FILE FORM COMPONENT
 * ============================================================================
 * Handles the end-to-end flow of securing a file:
 * 1. User selects a file (expo-document-picker)
 * 2. Basic validation (size, type)
 * 3. Client-side Base64 encoding
 * 4. Zero-Knowledge AES-256-GCM encryption
 * 5. Syncing to the secure vault
 */
export function AddFileForm({ template, onSuccess, onCancel }: Props) {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const { 
    fileInfo, 
    isProcessing, 
    pickFile, 
    prepareEncryptionPayload 
  } = useFileEncrypter();

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<any>({
    defaultValues: { title: '' },
    // We don't use the full fileSchema here for the form because base64 is handled internally
    resolver: zodResolver(fileSchema.omit({ fileName: true, fileSize: true, contentType: true, base64Data: true })),
  });

  const { mutate, isPending } = usePasswordMutation('create', onSuccess);


  const onSubmitForm = async (values: any) => {
    if (!fileInfo) {
      toast.error('No file selected');
      return;
    }

    const payload = await prepareEncryptionPayload(values.title, fileInfo);
    if (payload) {
      mutate(payload);
    }
  };

  return (
    <View className="flex-1">
      <FormField
        label="Entry Name"
        name="title"
        control={control}
        errors={errors}
        isDarkMode={isDarkMode}
        placeholder="My Passport, Insurance doc, etc."
      />

      <View className="mt-4">
        <Text className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">File</Text>
        <TouchableOpacity
          onPress={async () => {
            const picked = await pickFile();
            if (picked) {
              setValue('title', picked.name.split('.')[0]);
            }
          }}
          className="flex-row items-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900/50">
          <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
            <Ionicons name={fileInfo ? 'document' : 'cloud-upload-outline'} size={24} color="#10b981" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
              {fileInfo ? fileInfo.name : 'Choose a file'}
            </Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              {fileInfo ? `${(fileInfo.size / 1024 / 1024).toFixed(2)} MB` : 'Max size: 5MB'}
            </Text>
          </View>
          {fileInfo && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
        </TouchableOpacity>
      </View>

      <View className="mt-8 gap-3">
        <TouchableOpacity
          disabled={isPending || isProcessing || !fileInfo}
          className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
          onPress={handleSubmit(onSubmitForm)}>
          {isPending || isProcessing ? (
            <ActivityIndicator size="small" color="#022c22" />
          ) : (
            <Ionicons name="lock-closed-outline" size={20} color="#022c22" />
          )}
          <Text className="ml-2 text-lg font-bold text-[#022c22]">
            {isPending || isProcessing ? 'Securing...' : 'Encrypt & Save'}
          </Text>
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity 
            onPress={onCancel} 
            className="w-full flex-row items-center justify-center rounded-2xl border border-zinc-200 bg-white py-4 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900/50">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
