import React from 'react';
import { isExpoGo } from '@/src/utils/helper/checkIsExpo';

const isExpo = isExpoGo();

// Run this outside the component so it installs polyfills
// globally before your app logic runs.
if (!isExpo) {
  try {
    // 1. Use 'require' instead of 'import'
    const { install } = require('react-native-quick-crypto');

    // 2. Install the polyfills
    install();
    console.log('✅ react-native-quick-crypto installed.');
  } catch (error) {
    console.warn('⚠️ Failed to install react-native-quick-crypto:', error);
  }
} else {
  console.log('ℹ️ Running in Expo Go. Skipping quick-crypto native installation.');
}

export const CryptoProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
