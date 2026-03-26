import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/**
 * Renders the "The Lore & Manual" section in Settings.
 * Provides links to the About, Readme, and Dev Matrix screens.
 */
export default function InfoSection() {
  const router = useRouter();
  const isDev = process.env.APP_VARIANT !== 'production';

  return (
    <>
      <Text className="mb-3 ml-2 text-sm font-bold uppercase tracking-widest text-zinc-400">
        The Lore & Manual
      </Text>
      <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50/50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/40">
        <TouchableOpacity
          className="flex-row items-center border-b border-zinc-100 p-5 active:bg-zinc-200 dark:border-zinc-800/50 dark:active:bg-zinc-800/60"
          onPress={() => router.push('/about')}
        >
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
            <Ionicons name="book-outline" size={22} color="#6366f1" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">The Lore</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              The secret sauce and why it matters
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717a" />
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60 ${isDev ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''}`}
          onPress={() => router.push('/readme')}
        >
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-900/30">
            <Ionicons name="document-text-outline" size={22} color="#f97316" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">The Manual</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              How to stay unbreakable
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717a" />
        </TouchableOpacity>

        {isDev && (
          <TouchableOpacity
            className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60"
            onPress={() => router.push('/dev/database')}
          >
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
              <Ionicons name="terminal-outline" size={22} color="#10b981" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-emerald-500">The Matrix</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Raw db inspector (Dev only)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}
