import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

export default function AppAppearanceSection() {
 const { colorScheme, toggleColorScheme } = useColorScheme();
 const isDarkMode = colorScheme === 'dark';

 return (
  <>
   <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
    App Appearance
   </Text>
   <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
    <TouchableOpacity
     className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60"
     onPress={toggleColorScheme}>
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
