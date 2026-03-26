import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Wrapper } from '@components/providers';
import React, { useEffect, useCallback } from 'react';
import { useSyncTrigger } from '@hooks/useSyncTrigger';
import { GlobalErrorBoundary } from '@components/common/GlobalErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import { PasswordManager } from '@utils/PasswordManager';
import { AutofillPicker } from '@components/autofill/AutofillPicker';
import { AppState, View } from 'react-native';
import { useAutofillStore } from '@store/autofill';
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

  const { autofillSiteKey, setAutofillSiteKey, reset } = useAutofillStore();
  const [isInitializing, setIsInitializing] = React.useState(true);

  const checkAutofill = useCallback(async () => {
    try {
      const context = await PasswordManager.getAutofillContext();
      if (context?.siteKey) {
        setAutofillSiteKey(context.siteKey);
        // We hide splash early only if we're doing autofill to get that premium overlay feel
        await SplashScreen.hideAsync();
      }
    } catch (e) {
      console.warn('Autofill check failed', e);
    }
  }, [setAutofillSiteKey]);

  useEffect(() => {
    let active = true;

    async function init() {
      // 1. Check for autofill context first
      await checkAutofill();

      if (!active) return;

      // 2. Mark initialization as complete
      setIsInitializing(false);
    }

    init();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAutofill();
      }
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [checkAutofill]);

  useEffect(() => {
    if ((fontsLoaded || fontError) && !isInitializing) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isInitializing]);

  // CRITICAL: Until we have finished initial check and fonts are ready,
  // we render NOTHING but a blank container to prevent NavigationContainers
  // from mounting and competing for deep-link handling.
  if (isInitializing || (!fontsLoaded && !fontError)) {
    return <View style={{ flex: 1, backgroundColor: autofillSiteKey ? 'transparent' : '#000' }} />;
  }

  // CRITICAL: Isolation Mode
  // If we've found an autofill site key, we ONLY render the Picker.
  // The Stack is never mounted in this scenario, which fixes the multiple-container crash.
  if (autofillSiteKey) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GlobalErrorBoundary>
          <SafeAreaProvider>
            <Wrapper>
              <AppSyncManager>
                <AutofillPicker siteKey={autofillSiteKey} onClose={reset} />
              </AppSyncManager>
            </Wrapper>
          </SafeAreaProvider>
        </GlobalErrorBoundary>
      </GestureHandlerRootView>
    );
  }

  // Normal App Mode
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <SafeAreaProvider>
          <Wrapper>
            <AppSyncManager>
              <View style={{ flex: 1, backgroundColor: '#000' }}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    presentation: 'card',
                    gestureEnabled: true,
                  }}
                >
                  <Stack.Screen name="(drawer)" />
                  <Stack.Screen name="auth/index" />
                  <Stack.Screen name="auth/mfa" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="auth/signup/index" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </View>
            </AppSyncManager>
          </Wrapper>
        </SafeAreaProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
