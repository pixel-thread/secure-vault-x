import { ExpoConfig, ConfigContext } from 'expo/config';

const APP_VARIANT = process.env.APP_VARIANT || 'production';

const getAppConfig = (variant: string) => {
  switch (variant) {
    case 'development':
      return {
        name: 'Secure Vault X (Dev)',
        identifier: 'com.pixelthread.securevaultx.dev',
      };
    case 'preview':
      return {
        name: 'Secure Vault X (Preview)',
        identifier: 'com.pixelthread.securevaultx.preview',
      };
    default:
      return {
        name: 'Secure Vault X',
        identifier: 'com.pixelthread.securevaultx',
      };
  }
};

const configVars = getAppConfig(APP_VARIANT);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: configVars.name,
  slug: 'secure-vault-x',
  version: '0.1.2',
  scheme: ['securevaultx'],
  platforms: ['ios', 'android'],
  newArchEnabled: true,
  jsEngine: 'hermes',
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#ffffff',
        defaultChannel: 'default',
        enableBackgroundRemoteNotifications: true,
      },
    ],
    './plugins/withPasswordManager',
  ],
  experiments: {
    typedRoutes: true,
    tsconfigPaths: true,
  },
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splashscreen/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#09090b',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: configVars.identifier,
    buildNumber: '7',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#001010',
    },
    package: configVars.identifier,
    versionCode: 7,
    softwareKeyboardLayoutMode: 'resize',
  },
  extra: {
    router: {},
    eas: {
      projectId: 'b09a2c96-90ae-4795-b42f-c88731de08ee',
    },
    environment: APP_VARIANT,
  },
  owner: 'pixel-thread',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/b09a2c96-90ae-4795-b42f-c88731de08ee',
  },
});
