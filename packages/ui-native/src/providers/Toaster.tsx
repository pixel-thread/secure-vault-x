import React from 'react';
import { Toaster as SonnerToaster } from 'sonner-native';
import { useColorScheme } from 'nativewind';

interface ToasterProps {
  duration?: number;
}

/**
 * Premium Toaster component for Secure Vault X.
 * Customized with futuristic emerald styling and dark mode support.
 */
export const Toaster = ({ duration = 2000 }: ToasterProps) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <SonnerToaster
      duration={duration}
      theme={isDarkMode ? 'dark' : 'light'}
      toastOptions={{
        style: {
          backgroundColor: isDarkMode ? 'rgba(9, 9, 11, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDarkMode ? 'rgba(39, 39, 42, 0.8)' : 'rgba(228, 228, 231, 0.8)',
          borderWidth: 1,
          borderRadius: 24,
          padding: 16,
        },
        titleStyle: {
          fontSize: 16,
          fontWeight: '900',
          color: isDarkMode ? '#ffffff' : '#09090b',
          letterSpacing: -0.5,
        },
        descriptionStyle: {
          fontSize: 13,
          fontWeight: '600',
          color: isDarkMode ? '#a1a1aa' : '#71717a',
          marginTop: 2,
        },
      }}
    />
  );
};
