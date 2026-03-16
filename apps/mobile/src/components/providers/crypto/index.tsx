import React from 'react';
import { isExpoGo } from '@utils/helper/checkIsExpo';
import { logger } from '@securevault/utils-native';

const isExpo = isExpoGo();

// Run this outside the component so it installs polyfills
// globally before your app logic runs.
if (!isExpo) {
  try {
    // 1. Use 'require' instead of 'import'
    const { install } = require('react-native-quick-crypto');

    // 2. Install the polyfills
    install();
  } catch (error) {
    logger.error('Failed to install react-native-quick-crypto:', error);
  }
} else {
  logger.log('ℹ️ Running in Expo Go. Skipping quick-crypto native installation.');
}

export const CryptoProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
