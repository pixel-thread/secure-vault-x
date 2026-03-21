import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

/**
 * Renders the empty state for the vault.
 * Uses a relatable Gen Z tone to encourage the user to add their first secret.
 */
export const VaultEmpty = () => {
  return (
    <View className="mt-24 items-center justify-center px-10">
      <View className="mb-8 rounded-3xl border border-zinc-200 bg-zinc-50/50 p-10 dark:border-zinc-800/50 dark:bg-zinc-900/40">
        <Ionicons name="sparkles-outline" size={80} color="#10b981" />
      </View>
      <Text className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
        Ghost Town
      </Text>
      <Text className="mt-4 text-center text-lg font-medium leading-6 text-zinc-500 dark:text-zinc-400">
        Nothing here but echoes. Tap that plus button to start your unbreakable stash.
      </Text>
    </View>
  );
};
