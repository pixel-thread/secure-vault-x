import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

export const VaultEmpty = () => {
  return (
    <View className="mt-20 items-center justify-center">
      <View className="mb-6 rounded-full border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800/50 dark:bg-zinc-900/60">
        <Ionicons name="file-tray-outline" size={64} color="#71717a" />
      </View>
      <Text className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
        Your Vault is Empty
      </Text>
      <Text className="mt-2 text-center text-zinc-500">
        Tap the button below to add your first encrypted secret.
      </Text>
    </View>
  );
};
