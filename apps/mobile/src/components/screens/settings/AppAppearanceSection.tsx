import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@securevault/ui-native';
import { useThemeStore } from '@src/store/theme';

export default function AppAppearanceSection() {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <>
      <Text variant="small" className="mb-3 ml-2 uppercase tracking-wider text-muted-foreground">
        App Appearance
      </Text>
      <View className="mb-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <TouchableOpacity
          className="active:bg-accent/50 flex-row items-center p-5"
          onPress={toggleTheme}
        >
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
            <Ionicons
              name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
              size={22}
              color={isDarkMode ? '#10b981' : '#059669'}
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">Dark Mode</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              {isDarkMode ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          <Ionicons name="swap-horizontal-outline" size={20} color="#71717a" />
        </TouchableOpacity>
      </View>
    </>
  );
}
