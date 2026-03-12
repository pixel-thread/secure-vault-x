import { Suspense } from 'react';
import Redirect from '../common/Redirect';
import { TQueryProvider } from './query';
import { AuthProvider } from './auth';
import { CryptoProvider } from './crypto';
import { UpdateProvider } from './update';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Toaster } from 'sonner-native';
import { useColorScheme } from 'nativewind';

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
            <Suspense>
              <AuthProvider>
                <Redirect>{children}</Redirect>
              </AuthProvider>
            </Suspense>
          </CryptoProvider>
        </UpdateProvider>
        <Toaster duration={1000} theme={colorScheme as 'light' | 'dark'} />
      </ErrorBoundary>
    </TQueryProvider>
  );
};
