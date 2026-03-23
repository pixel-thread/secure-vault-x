import { ScrollView, View, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  message: string;
  onReset: () => void;
};

export const MigrationErrorScreen = ({ message, onReset }: Props) => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
        <View className="flex-1 items-center justify-center">
          <View className="mb-8 h-24 w-24 items-center justify-center rounded-3xl bg-red-500/10 shadow-xl shadow-red-500/10 dark:bg-red-500/20">
            <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
          </View>

          <Text className="mb-2 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Database Error
          </Text>

          <Text className="mb-8 text-center text-lg text-zinc-500 dark:text-zinc-400">
            We encountered an error while initializing your local vault database.
          </Text>

          <View className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
            <Text className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
              Technical Details
            </Text>
            <Text className="font-mono text-xs text-red-600 dark:text-red-400">{message}</Text>
          </View>

          <View className="mt-12 w-full">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onReset}
              className="w-full items-center rounded-2xl bg-zinc-900 py-4 shadow-lg active:scale-[0.98] dark:bg-white">
              <Text className="text-lg font-bold text-white dark:text-zinc-900">Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
