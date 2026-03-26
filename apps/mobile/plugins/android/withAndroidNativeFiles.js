const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const pkgName = config.android?.package || 'com.pixelthread.securevaultx.dev';
      const root = config.modRequest.projectRoot;

      const templatesRoot = path.join(__dirname, '../templates');

      const read = (p) =>
        fs.readFileSync(path.join(templatesRoot, p), 'utf8').replace(/PACKAGE_NAME/g, pkgName);

      // XML
      const resDir = path.join(root, 'android/app/src/main/res/xml');
      fs.mkdirSync(resDir, { recursive: true });
      fs.writeFileSync(
        path.join(resDir, 'autofill_service.xml'),
        read('android/autofill_service.xml'),
      );

      // Kotlin
      const javaDir = path.join(
        root,
        'android/app/src/main/java',
        pkgName.replace(/\./g, '/'),
        'autofill',
      );
      fs.mkdirSync(javaDir, { recursive: true });

      [
        'PasswordAutofillService.kt',
        'PasswordManagerModule.kt',
        'PasswordManagerPackage.kt',
      ].forEach((file) => {
        fs.writeFileSync(path.join(javaDir, file), read(`android/${file}`));
      });

      // TS bridge — Automatically generates the interface for React Native
      const utilsDir = path.join(root, 'src/utils/native-bridges');
      if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true });

      const tsTemplatePath = path.join(templatesRoot, 'js/PasswordManager.ts');
      if (fs.existsSync(tsTemplatePath)) {
        fs.writeFileSync(
          path.join(utilsDir, 'PasswordManager.ts'),
          fs.readFileSync(tsTemplatePath, 'utf8'),
        );
      }

      return config;
    },
  ]);
};
