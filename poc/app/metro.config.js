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
  resolver: {
    // react-native-mmkv 在 New Architecture 下依赖 nitro-modules,
    // 旧架构下不需要（stub 掉避免 Metro 报错）
    extraNodeModules: {
      'react-native-nitro-modules': path.join(__dirname, 'src', '_stubs', 'nitro-stub'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
