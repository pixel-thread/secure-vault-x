import { useThemeStore } from '@src/store/theme';
import { useEffect } from 'react';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { _hydrate, isHydrating } = useThemeStore();

  useEffect(() => {
    if (!isHydrating) {
      _hydrate();
    }
  }, [isHydrating]);

  return <>{children}</>;
};
