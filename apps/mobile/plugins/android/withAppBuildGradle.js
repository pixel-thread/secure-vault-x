const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function (config) {
  return withAppBuildGradle(config, (config) => {
    let c = config.modResults.contents;

    if (!c.includes('androidx.autofill')) {
      c = c.replace(
        /dependencies\s*\{/,
        'dependencies {\n    implementation "androidx.autofill:autofill:1.1.0"',
      );
    }

    config.modResults.contents = c;
    return config;
  });
};
