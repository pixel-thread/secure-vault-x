import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';

interface VaultEmptyProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

/**
 * Renders the empty state for the vault.
 * Uses a relatable Gen Z tone to encourage the user to add their first secret.
 * Now supports manual refresh and pull-to-refresh.
 */
export const VaultEmpty = ({ onRefresh, isRefreshing = false }: VaultEmptyProps) => {
  return (
    <View className="flex-1 items-center justify-center px-10 pb-20 mt-20">
      <View className="mb-8 rounded-3xl border border-zinc-200 bg-zinc-50/50 p-10 dark:border-zinc-800/50 dark:bg-zinc-900/40 shadow-sm">
        <Ionicons name="sparkles-outline" size={80} color="#10b981" />
      </View>
      <Text className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
        Ghost Town
      </Text>
      <Text className="mt-4 text-center text-lg font-medium leading-6 text-zinc-500 dark:text-zinc-400">
        Nothing here but echoes. Tap that plus button or refresh to manifest your stash.
      </Text>

      <TouchableOpacity
        onPress={onRefresh}
        disabled={isRefreshing}
        activeOpacity={0.7}
        className="mt-10 flex-row items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-8 py-4 shadow-sm active:scale-95"
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color="#10b981" />
        ) : (
          <>
            <Ionicons name="sync-outline" size={20} color="#10b981" />
            <Text className="ml-2 text-base font-bold text-emerald-600 dark:text-emerald-500">
              Refresh Stash
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};
