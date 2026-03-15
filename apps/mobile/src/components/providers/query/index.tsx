import React from 'react';
import { QueryClientProvider, QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { logger } from '@securevault/utils-native';

type Props = {
  children: React.ReactNode;
};

export const TQueryProvider: React.FC<Props> = ({ children }) => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        logger.error('Query failed', error);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        logger.error('Mutation failed', error);
      },
    }),
    defaultOptions: {
      queries: {
        refetchOnReconnect: true,
        retry: 3,
      },
      mutations: { retry: false },
    },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
