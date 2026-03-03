import { Suspense } from 'react';
import Redirect from '../common/Redirect';
import { TQueryProvider } from './query';
import { AuthProvider } from './auth';
import { CryptoProvider } from './crypto';

type Props = {
  children: React.ReactNode;
};

export const Wrapper = ({ children }: Props) => {
  return (
    <TQueryProvider>
      <CryptoProvider>
        <Suspense>
          <AuthProvider>
            <Redirect>{children}</Redirect>
          </AuthProvider>
        </Suspense>
      </CryptoProvider>
    </TQueryProvider>
  );
};
