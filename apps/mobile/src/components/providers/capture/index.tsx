import React, { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { toast } from 'sonner-native';
import { useAutofillStore } from '@store/autofill';

export const ScreenCaptureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { autofillSiteKey } = useAutofillStore();

  // 1. Enforce system-level blocking (Android: FLAG_SECURE, iOS: blocks recording/screenshots)
  // Skip if we are in autofill mode to avoid "activity no longer available" crashes
  // when the activity is finishing.
  useEffect(() => {
    if (!autofillSiteKey) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
      return () => {
        ScreenCapture.allowScreenCaptureAsync().catch(() => {});
      };
    }
  }, [autofillSiteKey]);

  useEffect(() => {
    // 2. Screenshot Detection & Toast
    const subscription = ScreenCapture.addScreenshotListener(() => {
      toast.error('No peeking', {
        description: 'Screen capture is blocked for your protection',
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return <>{children}</>;
};
