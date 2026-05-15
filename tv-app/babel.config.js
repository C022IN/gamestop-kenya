module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: { '@': './src' },
        },
      ],
      // Required by react-native-reanimated v4. MUST be the last plugin.
      'react-native-worklets/plugin',
    ],
  };
};
