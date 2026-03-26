import { Suspense, useEffect } from 'react';
import Redirect from '@components/common/Redirect';
import { TQueryProvider } from './query';
import { AuthProvider } from './auth';
import { CryptoProvider } from './crypto';
import { UpdateProvider } from './update';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { DBProvider } from './db';
import { ScreenCaptureProvider } from './capture';
import { VaultProvider } from './vault';
import { NotificationProvider } from './notification';
import { CronProvider } from './cron';

import { ThemeProvider, Toaster } from '@securevault/ui-native';
import { useThemeStore } from '@store/theme';

type Props = { children: React.ReactNode };

export const Wrapper = ({ children }: Props) => {
  const { isDarkMode, _hydrate, isHydrating } = useThemeStore((state: any) => ({
    isDarkMode: state.isDarkMode,
    _hydrate: state._hydrate,
    isHydrating: state.isHydrating,
  }));

  useEffect(() => {
    if (!isHydrating) {
      _hydrate();
    }
  }, [isHydrating, _hydrate]);

  return (
    <ThemeProvider initialTheme={isDarkMode ? 'dark' : 'light'}>
      <ErrorBoundary>
        <TQueryProvider>
          <AuthProvider>
            <Redirect>
              <UpdateProvider>
                <CryptoProvider>
                  <DBProvider>
                    <VaultProvider>
                      <NotificationProvider>
                        <CronProvider>
                          <Suspense>
                            <ScreenCaptureProvider>{children}</ScreenCaptureProvider>
                          </Suspense>
                        </CronProvider>
                      </NotificationProvider>
                    </VaultProvider>
                  </DBProvider>
                </CryptoProvider>
              </UpdateProvider>
            </Redirect>
          </AuthProvider>
        </TQueryProvider>
        <Toaster duration={2000} />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

/**
 * Minimal wrapper for the Autofill Overlay.
 * Skips navigation-aware providers (Redirect) and app-level auth prompts (AuthProvider)
 * to prevent Linking conflicts and redundant biometric triggers.
 */
export const AutofillWrapper = ({ children }: Props) => {
  const { isDarkMode, _hydrate, isHydrating } = useThemeStore((state: any) => ({
    isDarkMode: state.isDarkMode,
    _hydrate: state._hydrate,
    isHydrating: state.isHydrating,
  }));

  useEffect(() => {
    if (!isHydrating) {
      _hydrate();
    }
  }, [isHydrating, _hydrate]);

  return (
    <ThemeProvider initialTheme={isDarkMode ? 'dark' : 'light'}>
      <ErrorBoundary>
        <TQueryProvider>
          <CryptoProvider>
            <DBProvider>
              <VaultProvider>
                <Suspense>
                  <ScreenCaptureProvider>{children}</ScreenCaptureProvider>
                </Suspense>
              </VaultProvider>
            </DBProvider>
          </CryptoProvider>
        </TQueryProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};
