import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { toast } from 'sonner-native';
import { VaultSecretT } from '@src/types/vault';
import { useFileEncrypter } from '@hooks/useFileEncrypter';
import { truncateText } from '@securevault/utils';

interface Props {
  item: VaultSecretT;
}

/**
 * ============================================================================
 * FILE DETAIL VIEW COMPONENT
 * ============================================================================
 * Specialized viewer for encrypted files.
 *
 * SECURITY ADVISORY:
 * 1. Files are decrypted ONLY when the user taps "View File".
 * 2. Decrypted data is stored in the app-internal cache directory.
 * 3. Files are automatically deleted when the user leaves the screen (secure cleanup).
 */
export function FileDetailView({ item }: Props) {
  // Extract metadata from the vault item's dynamic fields
  const fields = item.fields || [];
  const getFieldValue = (label: string) => fields.find((f) => f.label === label)?.value;

  const fileName = getFieldValue('fileName') || 'secured_file';
  const fileSizeInBytes = parseInt(getFieldValue('fileSize') || '0', 10);
  const contentType = getFieldValue('contentType') || 'application/octet-stream';
  const encryptedBase64Payload = getFieldValue('base64Data');

  // useFileEncrypter handles both the processing state and the secure unmount cleanup
  const { isProcessing, decryptAndOpen } = useFileEncrypter();

  const handleDecryptAndOpenFile = () => {
    if (!encryptedBase64Payload) {
      toast.error('File data is acting up.');
      return;
    }
    decryptAndOpen(fileName, contentType, encryptedBase64Payload);
  };

  return (
    <View className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
      <View className="mb-6 flex-row items-center">
        <View className="mr-4 h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Ionicons name="document-text" size={32} color="#10b981" />
        </View>
        <View className="flex-1">
          <Text
            className="text-xl font-bold capitalize text-zinc-900 dark:text-white"
            numberOfLines={1}
          >
            {truncateText({ text: fileName, maxLength: 28 })}
          </Text>
          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
            {contentType} • {(fileSizeInBytes / 1024 / 1024).toFixed(2)} MB
          </Text>
        </View>
      </View>

      <TouchableOpacity
        disabled={isProcessing}
        onPress={handleDecryptAndOpenFile}
        className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 active:scale-[0.98] disabled:opacity-50"
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#022c22" />
        ) : (
          <Ionicons name="eye-outline" size={20} color="#022c22" />
        )}
        <Text className="ml-2 text-lg font-bold text-[#022c22]">
          {isProcessing ? 'Preparing...' : 'View File'}
        </Text>
      </TouchableOpacity>

      <Text className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
        This file is decrypted only when viewed and is wiped from storage when you leave this
        screen.
      </Text>
    </View>
  );
}
