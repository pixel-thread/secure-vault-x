import { Text, TouchableOpacity, View } from 'react-native';
import { VaultItemIcon } from './VaultIcon';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { toast } from 'sonner-native';
import { VaultSecretT } from '@src/types/vault';

export const VaultItem = ({
  item,
  onSelectItem,
}: {
  item: VaultSecretT;
  onSelectItem: (item: VaultSecretT) => void;
}) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  if (!item) return null;

  return (
    <TouchableOpacity
      key={item.id}
      className="mb-4 flex-row items-center rounded-3xl border border-zinc-200 bg-zinc-50 p-5 active:bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:active:bg-zinc-800/60"
      onPress={() => onSelectItem(item)}>
      <VaultItemIcon item={item} />
      <View className="flex-1">
        <Text className="mb-1 text-xl font-bold capitalize text-zinc-900 dark:text-white">
          {(item as any).title || (item as any).serviceName}
        </Text>
        
        {/* Dynamic Field Preview */}
        {(item as any).fields ? (
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {(item as any).fields[0]?.masked ? '••••••••' : (item as any).fields[0]?.value}
            {(item as any).fields[1] ? ` • ${(item as any).fields[1]?.masked ? '••••' : (item as any).fields[1]?.value}` : ''}
          </Text>
        ) : (
          /* Legacy Fallback */
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {item.type === 'password' ? (item as any).username : `•••• ${(item as any).cardNumber?.slice(-4)}`}
          </Text>
        )}
      </View>
      <TouchableOpacity
        className="h-10 w-10 items-center justify-center rounded-full bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800/80 dark:active:bg-zinc-700"
        onPress={() => {
          let textToCopy = '';
          if ((item as any).fields) {
            // Copy the first primary field (usually username, API key, etc.)
            textToCopy = (item as any).fields[0]?.value || '';
          } else {
            textToCopy = item.type === 'password' ? (item as any).secretInfo : (item as any).cardNumber;
          }
          Clipboard.setStringAsync(textToCopy);
          toast.success('Copied to clipboard');
        }}>
        <Ionicons name="copy-outline" size={20} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
