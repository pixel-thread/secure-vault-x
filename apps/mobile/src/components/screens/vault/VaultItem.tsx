import { Text, TouchableOpacity, View } from 'react-native';
import { VaultItemIcon } from './VaultIcon';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { toast } from 'sonner-native';
import { VaultSecretT } from '@/src/types/vault';

export const VaultItem = ({
  item,
  onSelectItem,
}: {
  item: VaultSecretT;
  onSelectItem: (item: VaultSecretT) => void;
}) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  return (
    <TouchableOpacity
      key={item.id}
      className="mb-4 flex-row items-center rounded-3xl border border-zinc-200 bg-zinc-50 p-5 active:bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:active:bg-zinc-800/60"
      onPress={() => onSelectItem(item)}>
      <VaultItemIcon item={item} />
      <View className="flex-1">
        {item.type === 'password' ? (
          <>
            <Text className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">
              {item.serviceName}
            </Text>
            <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {item.username}
            </Text>
          </>
        ) : (
          <>
            <Text className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">
              {item.serviceName}
            </Text>
            <Text className="font-mono text-sm font-medium tracking-widest text-zinc-500 dark:text-zinc-400">
              •••• {item.cardNumber?.slice(-4)}
            </Text>
          </>
        )}
      </View>
      <TouchableOpacity
        className="h-10 w-10 items-center justify-center rounded-full bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800/80 dark:active:bg-zinc-700"
        onPress={() => {
          const textToCopy = item.type === 'password' ? item.secretInfo : item.cardNumber;
          Clipboard.setStringAsync(textToCopy);
          toast.success('Copied to clipboard');
        }}>
        <Ionicons name="copy-outline" size={20} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
