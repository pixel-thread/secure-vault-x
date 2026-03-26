const { withAndroidStyles } = require('@expo/config-plugins');

module.exports = function withAndroidTranslucentTheme(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style;

    if (!styles.find((s) => s.$?.name === 'Theme.App.Translucent')) {
      styles.push({
        $: { name: 'Theme.App.Translucent', parent: 'Theme.AppCompat.Light.NoActionBar' },
        item: [
          { $: { name: 'android:windowIsTranslucent' }, _: 'true' },
          { $: { name: 'android:windowBackground' }, _: '@android:color/transparent' },
          { $: { name: 'android:windowSplashScreenBackground' }, _: '@android:color/transparent' },
        ],
      });
    }

    return config;
  });
};
