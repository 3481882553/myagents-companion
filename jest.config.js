/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  setupFilesAfterSetup: ['<rootDir>/src/__tests__/setup.ts'],
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
  },
};
