import { Suspense } from 'react';
import Redirect from '@components/common/Redirect';
import { TQueryProvider } from './query';
import { AuthProvider } from './auth';
import { CryptoProvider } from './crypto';
import { UpdateProvider } from './update';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { Toaster } from 'sonner-native';
import { DBProvider } from './db';
import { ScreenCaptureProvider } from './capture';
import { VaultProvider } from './vault';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

type Props = { children: React.ReactNode };

export const Wrapper = ({ children }: Props) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <ErrorBoundary>
      <StatusBar animated translucent style={isDarkMode ? 'dark' : 'light'} />
      <TQueryProvider>
        <AuthProvider>
          <Redirect>
            <UpdateProvider>
              <CryptoProvider>
                <DBProvider>
                  <VaultProvider>
                    <Suspense>
                      <ScreenCaptureProvider>{children}</ScreenCaptureProvider>
                    </Suspense>
                  </VaultProvider>
                </DBProvider>
              </CryptoProvider>
            </UpdateProvider>
          </Redirect>
        </AuthProvider>
      </TQueryProvider>
      <Toaster duration={1000} theme={isDarkMode ? 'dark' : 'light'} />
    </ErrorBoundary>
  );
};
