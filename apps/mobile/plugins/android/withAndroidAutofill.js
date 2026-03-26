const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidAutofill(config) {
  return withAndroidManifest(config, (config) => {
    const pkgName = config.android?.package || 'com.pixelthread.securevaultx.dev';
    const app = config.modResults.manifest.application[0];

    if (!app.service) app.service = [];

    const serviceName = pkgName + '.autofill.PasswordAutofillService';

    const serviceDef = {
      $: {
        'android:name': serviceName,
        'android:permission': 'android.permission.BIND_AUTOFILL_SERVICE',
        'android:exported': 'true',
      },
      'intent-filter': [
        { action: [{ $: { 'android:name': 'android.service.autofill.AutofillService' } }] },
      ],
      'meta-data': [
        { $: { 'android:name': 'android.autofill', 'android:resource': '@xml/autofill_service' } },
      ],
    };

    const existing = app.service.findIndex((s) => s.$?.['android:name'] === serviceName);
    if (existing >= 0) app.service[existing] = serviceDef;
    else app.service.push(serviceDef);

    const mainActivity = app.activity.find((a) => a['$']?.['android:name'] === '.MainActivity');
    if (mainActivity) {
      mainActivity['$']['android:theme'] = '@style/Theme.App.Translucent';
      mainActivity['$']['android:launchMode'] = 'singleTask';
    }

    return config;
  });
};
