import { View, Text, ActivityIndicator } from 'react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  isSyncing?: boolean;
  isLoading?: boolean;
}

/**
 * Normal Page Header component.
 * Purely for display within screen content, handling its own safe area padding.
 */
export default function Header({
  title,
  subtitle,
  rightElement,
  isSyncing,
  isLoading,
}: HeaderProps) {
  const showSpinner = isSyncing || isLoading;

  return (
    <View className="z-10 border-b border-zinc-200/50 bg-white/80 px-6 py-4 pb-6 dark:border-zinc-800/50 dark:bg-[#09090b]/80">
      <View className="flex-row items-center justify-between">
        {/* Main Content Area */}
        <View className="flex-1 pr-4">
          <View className="flex-row items-center">
            <Text className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
              {title}
            </Text>
            {showSpinner && (
              <ActivityIndicator size="small" color="#10b981" className="ml-3 mt-1.5" />
            )}
          </View>
          {subtitle && (
            <Text className="mt-1 text-xs font-bold uppercase tracking-[4px] text-emerald-600 dark:text-emerald-500">
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Section */}
        {rightElement && <View className="flex-row items-center">{rightElement}</View>}
      </View>
    </View>
  );
}
