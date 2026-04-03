const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Font + 3D model extensions as static assets
const extraAssetExts = ['woff', 'woff2', 'ttf', 'otf', 'glb', 'gltf'];
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, ...extraAssetExts])];

module.exports = config;
