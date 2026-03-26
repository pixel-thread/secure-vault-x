import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Wrapper, AutofillWrapper } from '@components/providers';
import React, { useEffect, useCallback } from 'react';
import { useSyncTrigger } from '@hooks/useSyncTrigger';
import { GlobalErrorBoundary } from '@components/common/GlobalErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import { PasswordManager } from '@utils/PasswordManager';
import { AutofillPicker } from '@components/autofill/AutofillPicker';
import { AppState, View } from 'react-native';
import { useAutofillStore } from '@store/autofill';
import { initGlobalErrorTracking } from '@utils/errors';
import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
  JetBrainsMono_800ExtraBold,
} from '@expo-google-fonts/jetbrains-mono';
import { Ternary } from '@src/components/common/Ternary';
import { logger } from '@securevault/utils-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Initialize global error tracking to capture "uncaught errors"
initGlobalErrorTracking();

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

  const { autofillSiteKey, isAutofilling, setAutofillSiteKey, reset } = useAutofillStore();
  const [isInitializing, setIsInitializing] = React.useState(true);

  const checkAutofill = useCallback(async () => {
    try {
      const context = await PasswordManager.getAutofillContext();
      if (context?.siteKey) {
        setAutofillSiteKey(context.siteKey);
        await SplashScreen.hideAsync();
      }
    } catch (e) {
      logger.warn('Autofill check failed', e);
    }
  }, [setAutofillSiteKey]);

  useEffect(() => {
    let active = true;

    async function init() {
      await checkAutofill();
      if (!active) return;
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

  if (isInitializing || (!fontsLoaded && !fontError)) {
    return <View style={{ flex: 1, backgroundColor: autofillSiteKey ? 'transparent' : '#000' }} />;
  }

  // Normal App Mode
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <SafeAreaProvider>
          <Wrapper>
            <AppSyncManager>
              <Ternary
                condition={!!autofillSiteKey && isAutofilling}
                ifTrue={<AutofillPicker siteKey={autofillSiteKey || ''} onClose={reset} />}
                ifFalse={
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
                }
              />
            </AppSyncManager>
          </Wrapper>
        </SafeAreaProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
