import { logger } from '@securevault/utils-native';

/**
 * Initializes global error and promise rejection trackers.
 * This helps capture "uncaught errors" that might not be visible in standard logs.
 */
export function initGlobalErrorTracking() {
  if (__DEV__) {
    // In dev, we still want to see the errors in the console
    return;
  }

  // Handle global uncaught errors
  // @ts-ignore - ErrorUtils is a React Native global
  const globalHandler = ErrorUtils.getGlobalHandler();
  // @ts-ignore
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    logger.error('Global Uncaught Error', {
      message: error.message,
      stack: error.stack,
      isFatal,
    });

    // Pass to original handler
    if (globalHandler) {
      globalHandler(error, isFatal);
    }
  });

  // Note: Unhandled promise rejections are harder to catch globally in Hermez/RN
  // without specific polyfills, but we can try to wrap key entry points.
}
