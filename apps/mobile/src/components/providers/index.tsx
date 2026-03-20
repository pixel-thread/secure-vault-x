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
import { useThemeStore } from '@src/store/theme';

type Props = { children: React.ReactNode };

export const Wrapper = ({ children }: Props) => {
  const { isDarkMode } = useThemeStore();

  return (
    <ErrorBoundary>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
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
