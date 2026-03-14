module.exports = function (api) {
  api.cache(true);
  let plugins = [
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.sql'],
      },
    ],
  ];

  plugins.push('react-native-worklets/plugin');

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
