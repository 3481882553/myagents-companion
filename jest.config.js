/** @type {import('jest').Config} */
module.exports = {
  // preset: 'react-native',  // 需要 RN 项目初始化后启用
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
    '<rootDir>/src/**/*.test.(ts|tsx)',
  ],
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/db/**/*.ts',
    'src/theme/**/*.ts',
    'src/server/middleware/**/*.ts',
    'src/components/tools/**/*.tsx',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
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
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less)$': '<rootDir>/src/__tests__/mocks/style-mock.js',
    '\\.(md)$': '<rootDir>/src/__tests__/mocks/file-mock.js',
    '^react$': '<rootDir>/src/__tests__/mocks/react.js',
    '^react-native$': '<rootDir>/src/__tests__/mocks/react-native.js',
    '^react-native-mmkv$': '<rootDir>/src/__tests__/mocks/react-native-mmkv.js',
    '^react-native-webview$': '<rootDir>/src/__tests__/mocks/react-native-webview.js',
    '^react-native-keychain$': '<rootDir>/src/__tests__/mocks/react-native-keychain.js',
    '^react-native-sse$': '<rootDir>/src/__tests__/mocks/react-native-sse.js',
  },
};
