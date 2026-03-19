import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Wrapper } from '@components/providers';
import React, { useEffect } from 'react';
import { useSyncTrigger } from '@hooks/useSyncTrigger';

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
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider className="bg-white dark:bg-[#09090b]">
        <Wrapper>
          <AppSyncManager>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}>
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              <Stack.Screen name="auth/index" options={{ headerShown: false }} />
              <Stack.Screen
                name="auth/mfa"
                options={{
                  presentation: 'modal',
                  title: 'Two-Factor Authentication',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="auth/signup/index"
                options={{
                  presentation: 'modal',
                  title: 'Sign Up',
                  headerShown: false,
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
