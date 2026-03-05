import { Suspense } from 'react';
import Redirect from '../common/Redirect';
import { TQueryProvider } from './query';
import { AuthProvider } from './auth';
import { CryptoProvider } from './crypto';
import { UpdateProvider } from './update';
import { ErrorBoundary } from '../common/ErrorBoundary';

type Props = {
  children: React.ReactNode;
};

export const Wrapper = ({ children }: Props) => {
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
      </ErrorBoundary>
    </TQueryProvider>
  );
};
