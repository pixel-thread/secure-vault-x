import { Suspense } from 'react';
import Redirect from '../common/Redirect';
import { TQueryProvider } from './query';

type Props = {
  children: React.ReactNode;
};

export const Wrapper = ({ children }: Props) => {
  return (
    <TQueryProvider>
      <Suspense>
        <Redirect>{children}</Redirect>
      </Suspense>
    </TQueryProvider>
  );
};
