import { Suspense } from 'react';
import Redirect from '../common/Redirect';
import { TQueryProvider } from './query';
import { AuthProvider } from './auth';

type Props = {
  children: React.ReactNode;
};

export const Wrapper = ({ children }: Props) => {
  return (
    <TQueryProvider>
      <Suspense>
        <AuthProvider>
          <Redirect>{children}</Redirect>
        </AuthProvider>
      </Suspense>
    </TQueryProvider>
  );
};
