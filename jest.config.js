/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/poc/app/src/__tests__/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '<rootDir>/poc/app/src/**/__tests__/**/*.test.(ts|tsx)',
    '<rootDir>/poc/app/src/**/*.test.(ts|tsx)',
  ],
  collectCoverageFrom: [
    'poc/app/src/services/**/*.ts',
    'poc/app/src/db/**/*.ts',
    'poc/app/src/theme/**/*.ts',
    'poc/app/src/server/middleware/**/*.ts',
    'poc/app/src/components/tools/**/*.tsx',
    '!poc/app/src/**/*.d.ts',
    '!poc/app/src/**/__tests__/**',
    '!poc/app/src/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/poc/app/src/$1',
    '\\.(css|less)$': '<rootDir>/poc/app/src/__tests__/mocks/style-mock.js',
    '\\.(md)$': '<rootDir>/poc/app/src/__tests__/mocks/file-mock.js',
    '^react$': '<rootDir>/poc/app/src/__tests__/mocks/react.js',
    '^react-native$': '<rootDir>/poc/app/src/__tests__/mocks/react-native.js',
    '^react-native-mmkv$': '<rootDir>/poc/app/src/__tests__/mocks/react-native-mmkv.js',
    '^react-native-webview$': '<rootDir>/poc/app/src/__tests__/mocks/react-native-webview.js',
    '^react-native-keychain$': '<rootDir>/poc/app/src/__tests__/mocks/react-native-keychain.js',
    '^react-native-sse$': '<rootDir>/poc/app/src/__tests__/mocks/react-native-sse.js',
    '^@react-native-clipboard/clipboard$': '<rootDir>/poc/app/src/__tests__/mocks/clipboard.js',
    '^@react-native-async-storage/async-storage$': '<rootDir>/poc/app/src/__tests__/mocks/async-storage.js',
    '^test-renderer$': '<rootDir>/node_modules/react-test-renderer',
  },
};
