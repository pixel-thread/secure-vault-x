import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Wrapper } from '@components/providers';
import React, { useEffect } from 'react';
import { useSyncTrigger } from '@hooks/useSyncTrigger';
import { LoadingScreen } from '@src/components/common/LoadingScreen';
import { GlobalErrorBoundary } from '@components/common/GlobalErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
  JetBrainsMono_800ExtraBold,
} from '@expo-google-fonts/jetbrains-mono';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded, fontError] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    JetBrainsMono_800ExtraBold,
  });

  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
    }
  }, [isMounted]);

  if (!isMounted || (!fontsLoaded && !fontError)) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <SafeAreaProvider>
          <Wrapper>
            <AppSyncManager>
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  animationTypeForReplace: 'push',
                  presentation: 'card',
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                }}
              >
                <Stack.Screen name="(drawer)" />
                <Stack.Screen name="auth/index" />
                <Stack.Screen
                  name="auth/mfa"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
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
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
