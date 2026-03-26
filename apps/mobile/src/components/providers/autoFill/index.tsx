import { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from '@components/common/ErrorBoundary';

import { ThemeProvider, Toaster } from '@securevault/ui-native';
import { useThemeStore } from '@store/theme';
import { TQueryProvider } from '../query';
import { CryptoProvider } from '../crypto';
import { DBProvider } from '../db';
import { VaultProvider } from '../vault';
import { ScreenCaptureProvider } from '../capture';
import { BiometricProvider } from '../auth/BiometricProvider';

type Props = { children: React.ReactNode };

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
        <BiometricProvider>
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
        </BiometricProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};
