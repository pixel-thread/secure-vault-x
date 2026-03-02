import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Wrapper } from '../components/providers';
import React, { useEffect } from 'react';

import { Toaster } from 'sonner-native';
import { useColorScheme } from 'nativewind';

export const unstable_settings = {
  initialRouteName: 'auth/index',
};

export default function RootLayout() {
  const [isMounted, setIsMounted] = React.useState(false);
  const { colorScheme } = useColorScheme();

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
      <SafeAreaProvider>
        <Wrapper>
          <Stack>
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/index" options={{ headerShown: false }} />
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
          <Toaster theme={colorScheme as 'light' | 'dark'} />
        </Wrapper>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
