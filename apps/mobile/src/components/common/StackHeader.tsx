import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { DrawerToggleButton } from '@react-navigation/drawer';

/**
 * Universal Header Props that can be passed manually or injected by Navigators 
 * (Stack, Tabs, Drawer).
 */
export type CustomHeaderProps = {
  title?: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  backButton?: boolean;
  isDrawer?: boolean;
} & Record<string, any>; // Allow any other props from navigators

/**
 * A universal header component that works across all Expo Router / React Navigation contexts.
 * It manually handles the safe area and matches the app's premium design system.
 */
export const HeaderComponent = (props: any) => {
  const {
    title,
    subtitle,
    rightElement,
    backButton,
    isDrawer,
    options,
    route,
  } = props;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // 1. Resolve Title: Manual Prop > Navigator Option > Route Name
  const displayTitle =
    title ?? options?.headerTitle?.toString() ?? options?.title ?? route?.name ?? '';

  // 2. Resolve Navigation Actions: 
  // If we are in a stack and can go back, show back button by default
  const showBackButton = backButton ?? (router.canGoBack() && !isDrawer);

  return (
    <View
      style={{ paddingTop: insets.top }}
      className="z-50 flex-row items-center justify-between border-b border-zinc-100 bg-white px-4 pb-4 dark:border-zinc-800/50 dark:bg-[#09090b]">

      {/* --- Left Action Area --- */}
      <View className="w-12 items-start justify-center">
        {showBackButton ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <Ionicons name="chevron-back" size={22} color={isDarkMode ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
        ) : isDrawer ? (
          <DrawerToggleButton tintColor={isDarkMode ? '#ffffff' : '#000000'} />
        ) : null}
      </View>

      {/* --- Center Content --- */}
      <View className="flex-1 items-center justify-center px-2">
        <Text
          className="text-[17px] font-bold tracking-tight text-black dark:text-white"
          numberOfLines={1}>
          {displayTitle}
        </Text>

        {subtitle && (
          <Text
            className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500"
            numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* --- Right Action Area --- */}
      <View className="w-12 items-end justify-center">
        {rightElement}
      </View>
    </View>
  );
};

/**
 * Expo Router Stack Helper
 * Usage: <StackHeader title="My Screen" /> inside a screen component.
 */
export const StackHeader = (props: CustomHeaderProps) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Stack.Screen
      options={{
        header: (headerProps) => <HeaderComponent {...headerProps} {...props} />,
        headerShown: true,
        headerStyle: { backgroundColor: isDarkMode ? '#09090b' : '#fff' },
        headerTintColor: isDarkMode ? '#fff' : '#000',
        headerTitleStyle: { color: isDarkMode ? '#fff' : '#000' },
      }}
    />
  );
};

export const CustomHeader = StackHeader;
