import { Redirect } from 'expo-router';

/**
 * Route: /dev/database
 * Directs to the raw database inspector.
 * Security: Only accessible in development mode.
 */
export default function DatabaseRoute() {
  const isDev = process.env.APP_VARIANT !== 'production';

  if (!isDev) {
    return <Redirect href="/" />;
  }

  return null;
}
