const { withMainApplication } = require('@expo/config-plugins');

module.exports = function withRegisterPackage(config) {
  return withMainApplication(config, (config) => {
    const pkgName = config.android?.package || 'com.pixelthread.securevaultx.dev';
    let c = config.modResults.contents;

    // Use robust import without non-idiomatic semicolon
    const imp = `import ${pkgName}.autofill.PasswordManagerPackage`;

    if (!c.includes(imp)) {
      c = c.replace(/^(package .+)$/m, `$1\n\n${imp}`);
    }

    // Safer registration logic - targets the standard PackageList apply block
    const pkgSearchFlag = 'PasswordManagerPackage()';
    if (!c.includes(pkgSearchFlag)) {
      c = c.replace(
        /(PackageList\(this\)\.packages\.apply\s*\{\s*)/,
        `$1add(${pkgSearchFlag})\n              `,
      );
    }

    config.modResults.contents = c;
    return config;
  });
};
