import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { useVaultContext } from '@src/hooks/vault/useVaultContext';

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
} & Record<string, unknown>; // Allow any other props from navigators

/**
 * Expo Router Stack Helper
 * Usage: <StackHeader title="My Screen" /> inside a screen component.
 */
export const StackHeader = (props: CustomHeaderProps) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const {
    isLoading: { isSyncing },
  } = useVaultContext();
  const title = isSyncing ? 'Syncing...' : props.title || '';
  return (
    <Stack.Screen
      options={{
        ...props,
        title: title,
        headerTitle: title,
        headerShown: true,
        headerStyle: { backgroundColor: isDarkMode ? '#09090b' : '#fff' },
        headerTintColor: isDarkMode ? '#fff' : '#000',
        headerTitleStyle: { color: isDarkMode ? '#fff' : '#000' },
      }}
    />
  );
};
