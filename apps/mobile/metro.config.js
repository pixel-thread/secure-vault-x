const { getDefaultConfig } = require('expo/metro-config');
const path = require('path'); // Removed braces
const { withNativeWind } = require('nativewind/metro');

const projectRoot = path.resolve(__dirname);
// Go up two levels to the monorepo root
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// IMPORTANT: Tell Metro to watch the whole monorepo
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Existing SQL and Crypto logic
config.resolver.sourceExts.push('sql');

// Polyfill node:crypto with react-native-quick-crypto for React Native

config.resolver.sourceExts.push('sql');
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('react-native-quick-crypto'),
  'node:crypto': require.resolve('react-native-quick-crypto'),
};

config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: './src/app/global.css' });
