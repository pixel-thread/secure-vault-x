import { Text, TouchableOpacity, View } from 'react-native';
import { VaultItemIcon } from './VaultIcon';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { toast } from 'sonner-native';
import { VaultSecretT } from '@src/types/vault';
import { truncateText } from '@securevault/utils';
import { Redirect } from 'expo-router';

export const VaultItem = ({
  item,
  onSelectItem,
}: {
  item: VaultSecretT;
  onSelectItem: (item: VaultSecretT) => void;
}) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const title = (item as any).title || (item as any).serviceName;

  if (!item) return <Redirect href={'/(drawer)/(tabs)'} />;

  return (
    <TouchableOpacity
      key={item.id}
      className="mb-4 flex-row items-center gap-x-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 active:bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:active:bg-zinc-800/60"
      onPress={() => onSelectItem(item)}>
      <VaultItemIcon item={item} />
      <View className="flex-1">
        <Text className="mb-1 text-xl font-bold capitalize text-zinc-900 dark:text-white">
          {truncateText({ text: title, maxLength: 28 })}
        </Text>

        {/* Dynamic Field Preview */}
        {(item as any).fields ? (
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {(item as any).fields[0]?.masked ? '••••••••' : (item as any).fields[0]?.value}
            {(item as any).fields[1]
              ? ` • ${(item as any).fields[1]?.masked ? '••••' : (item as any).fields[1]?.value}`
              : ''}
          </Text>
        ) : (
          /* Legacy Fallback */
          <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {item.type === 'login'
              ? (item as any).username
              : `•••• ${(item as any).cardNumber?.slice(-4) || '****'}`}
          </Text>
        )}

        {/* Metadata Badges */}
        {(item.meta?.environment || (item.meta?.tags && item.meta.tags.length > 0)) && (
          <View className="mt-2 flex-row flex-wrap gap-1">
            {item.meta?.environment && (
              <View
                className={`rounded-md border px-1.5 py-0.5 ${
                  item.meta.environment === 'prod'
                    ? 'border-red-500/20 bg-red-500/10'
                    : item.meta.environment === 'staging'
                      ? 'border-amber-500/20 bg-amber-500/10'
                      : 'border-emerald-500/20 bg-emerald-500/10'
                }`}>
                <Text
                  className={`text-[8px] font-black uppercase ${
                    item.meta.environment === 'prod'
                      ? 'text-red-600'
                      : item.meta.environment === 'staging'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                  }`}>
                  {item.meta.environment}
                </Text>
              </View>
            )}
            {item.meta?.tags?.slice(0, 3).map((tag) => (
              <View
                key={tag}
                className="rounded-md bg-zinc-200/50 px-1.5 py-0.5 dark:bg-zinc-800/80">
                <Text className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400">
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
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
            textToCopy =
              item.type === 'login' ? (item as any).secretInfo : (item as any).cardNumber;
          }
          Clipboard.setStringAsync(textToCopy);
          toast.success('Copied to clipboard');
        }}>
        <Ionicons name="copy-outline" size={20} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};
