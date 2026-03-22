const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('woff');
config.resolver.assetExts.push('ttf');
config.resolver.assetExts.push('otf');

module.exports = config;

