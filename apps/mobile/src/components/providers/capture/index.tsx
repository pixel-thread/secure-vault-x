import React, { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { toast } from 'sonner-native';

export const ScreenCaptureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Enforce system-level blocking (Android: FLAG_SECURE, iOS: blocks recording/screenshots)
  // This automatically handles the "black screen" or "blocking" behavior.
  ScreenCapture.usePreventScreenCapture();

  useEffect(() => {
    // 2. Screenshot Detection & Toast
    const subscription = ScreenCapture.addScreenshotListener(() => {
      toast.error('No peeking', {
        description: 'Screen capture is blocked for your protection.',
      });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return <>{children}</>;
};
