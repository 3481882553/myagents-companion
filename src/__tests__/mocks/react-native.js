module.exports = {
  Platform: { OS: 'android', select: (obj) => obj.android || obj.default },
  useColorScheme: () => 'light',
  AppState: {
    addEventListener: jest.fn(),
    currentState: 'active',
  },
  Linking: {
    openURL: jest.fn(),
  },
};
