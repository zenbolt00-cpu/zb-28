module.exports = function(api) {
  api.cache(true);

  const plugins = [];
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  // React Native Reanimated MUST be last
  plugins.push('react-native-reanimated/plugin');

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins,
  };
};

