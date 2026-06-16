const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const path = require('path');
const config = {
  cacheStores: [
    // Metro 缓存到 D 盘（避免 C 盘膨胀）
    new (require('metro-cache').FileStore)({
      root: path.join('D:', 'metro-cache'),
    }),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
