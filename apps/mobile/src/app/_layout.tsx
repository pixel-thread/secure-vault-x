import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { Wrapper } from '@components/providers';
import React, { useEffect } from 'react';
import { useSyncTrigger } from '@hooks/useSyncTrigger';
import { GlobalErrorBoundary } from '@components/common/GlobalErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import { PasswordManager } from '@src/PasswordManager';
import { AutofillPicker } from '@components/autofill/AutofillPicker';
import { AppState, View } from 'react-native';
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
  const [autofillSiteKey, setAutofillSiteKey] = React.useState<string | null>(null);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const checkAutofill = async () => {
    const context = await PasswordManager.getAutofillContext();
    if (context?.siteKey) {
      setAutofillSiteKey(context.siteKey);
      // Hide splash immediately for premium overlay experience
      SplashScreen.hideAsync();
    }
  };

  useEffect(() => {
    if (!isMounted) {
      setIsMounted(true);
      checkAutofill();
    }

    // Listen for app state changes (when user taps "Select Credential" from another app)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAutofill();
      }
    });

    return () => subscription.remove();
  }, [isMounted]);

  if (!isMounted) {
    return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
  }

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <SafeAreaProvider>
          <Wrapper>
            <AppSyncManager>
              <View style={{ flex: 1, backgroundColor: autofillSiteKey ? 'transparent' : '#000' }}>
                <View style={{ flex: 1, opacity: autofillSiteKey ? 0 : 1 }}>
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
                </View>
                {autofillSiteKey && (
                  <AutofillPicker
                    siteKey={autofillSiteKey}
                    onClose={() => setAutofillSiteKey(null)}
                  />
                )}
              </View>
            </AppSyncManager>
          </Wrapper>
        </SafeAreaProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
