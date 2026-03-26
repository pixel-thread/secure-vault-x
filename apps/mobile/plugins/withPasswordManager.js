const { createRunOncePlugin } = require('@expo/config-plugins');

const withAndroidAutofill = require('./android/withAndroidAutofill');
const withAndroidTranslucentTheme = require('./android/withAndroidTranslucentTheme');
const withAndroidNativeFiles = require('./android/withAndroidNativeFiles');
const withRegisterPackage = require('./android/withRegisterPackage');
const withAppBuildGradle = require('./android/withAppBuildGradle');

const pkg = { name: 'secure-vault-x', version: '1.0.0' };

const withPasswordManager = (config) => {
  config = withAndroidAutofill(config);
  config = withAndroidTranslucentTheme(config);
  config = withAndroidNativeFiles(config);
  config = withRegisterPackage(config);
  config = withAppBuildGradle(config);
  return config;
};

module.exports = createRunOncePlugin(withPasswordManager, pkg.name, pkg.version);
