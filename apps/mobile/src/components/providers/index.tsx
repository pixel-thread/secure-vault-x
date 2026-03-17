import { Suspense } from 'react';
import Redirect from '@components/common/Redirect';
import { TQueryProvider } from './query';
import { AuthProvider } from './auth';
import { CryptoProvider } from './crypto';
import { UpdateProvider } from './update';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { Toaster } from 'sonner-native';
import { useColorScheme } from 'nativewind';
import { DBProvider } from './db';

type Props = {
  children: React.ReactNode;
};

export const Wrapper = ({ children }: Props) => {
  const { colorScheme } = useColorScheme();
  return (
    <TQueryProvider>
      <ErrorBoundary>
        <UpdateProvider>
          <CryptoProvider>
            <DBProvider>
              <Suspense>
                <AuthProvider>
                  <Redirect>{children}</Redirect>
                </AuthProvider>
              </Suspense>
            </DBProvider>
          </CryptoProvider>
        </UpdateProvider>
        <Toaster duration={1000} theme={colorScheme as 'light' | 'dark'} />
      </ErrorBoundary>
    </TQueryProvider>
  );
};
