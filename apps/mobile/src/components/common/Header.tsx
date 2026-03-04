import { View, Text, ActivityIndicator } from 'react-native';

interface HeaderProps {
  title: string;
  subtitle: string;
  rightElement?: React.ReactNode;
  isSyncing?: boolean;
  isLoading?: boolean;
}

export default function Header({
  title,
  subtitle,
  rightElement,
  isSyncing,
  isLoading
}: HeaderProps) {
  const showSpinner = isSyncing || isLoading;

  return (
    <View className="z-10 flex-row items-center justify-between border-b border-zinc-200 bg-white/90 px-6 pb-6 pt-12 dark:border-zinc-900/80 dark:bg-[#09090b]/90">
      <View className="flex-1 pr-4">
        <View className="flex-row items-center">
          <Text className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {title}
          </Text>
          {showSpinner && (
            <ActivityIndicator size="small" color="#10b981" className="ml-3 mt-1" />
          )}
        </View>
        <Text className="mt-1 text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
          {subtitle}
        </Text>
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
}
