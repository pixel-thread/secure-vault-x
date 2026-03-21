import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Wrapper } from '@components/providers';
import React, { useEffect } from 'react';
import { useSyncTrigger } from '@hooks/useSyncTrigger';
import { Platform } from 'react-native';
import { LoadingScreen } from '@src/components/common/LoadingScreen';

const AppSyncManager = ({ children }: { children: React.ReactNode }) => {
  useSyncTrigger();
  return <>{children}</>;
};

// Suppress the "[Reanimated] Reading from `value` during component render" warning.
// This is triggered internally by @react-navigation/drawer v7 and is a known issue
// in the library, not in our application code.

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export const unstable_settings = {
  initialRouteName: 'auth/index',
};

export default function RootLayout() {
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
    }
  }, [isMounted]);

  if (!isMounted) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider className="bg-white dark:bg-[#09090b]">
        <Wrapper>
          <AppSyncManager>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right', // 👈 consistent animation
                animationTypeForReplace: 'push', // 👈 fixes Android replace behavior
                presentation: 'card', // 👈 REQUIRED for Android animations
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
                contentStyle: { backgroundColor: '#fff' }, // 👈 avoid transparent bugs
              }}>
              <Stack.Screen name="(drawer)" />
              <Stack.Screen name="auth/index" />
              <Stack.Screen
                name="auth/mfa"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom', // 👈 better UX for modals
                }}
              />
              <Stack.Screen
                name="auth/signup/index"
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AppSyncManager>
        </Wrapper>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
