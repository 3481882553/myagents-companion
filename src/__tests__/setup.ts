/**
 * Jest 全局配置
 *
 * 在 jest.config.js 中通过 setupFilesAfterSetup 引用
 */

// 模拟 React Native 模块
jest.mock('react-native', () => ({
  Platform: { OS: 'android', select: jest.fn((obj) => obj.android || obj.default) },
  useColorScheme: jest.fn(() => 'light'),
  AppState: {
    addEventListener: jest.fn(),
    currentState: 'active',
  },
  Linking: {
    openURL: jest.fn(),
  },
}));

// 模拟 react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => {
    const store = new Map<string, string>();
    return {
      getString: jest.fn((key: string) => store.get(key)),
      set: jest.fn((key: string, value: string) => store.set(key, value)),
      delete: jest.fn((key: string) => store.delete(key)),
    };
  }),
}));

// 模拟 react-native-webview
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: React.forwardRef((props: any, ref: any) =>
      React.createElement('WebView', { ...props, ref })
    ),
  };
});

// 模拟 react-native-keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

// 全局 fetch mock
global.fetch = jest.fn();

// 清理每个测试
afterEach(() => {
  jest.clearAllMocks();
});
