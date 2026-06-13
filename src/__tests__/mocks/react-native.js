module.exports = {
  Platform: { OS: 'android', select: (obj) => obj.android || obj.default },
  useColorScheme: () => 'light',
  StyleSheet: {
    create: (styles) => styles,
  },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  SafeAreaView: 'SafeAreaView',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  AppState: {
    addEventListener: () => {},
    currentState: 'active',
  },
  Linking: {
    openURL: () => {},
  },
  BackHandler: {
    addEventListener: () => ({ remove: () => {} }),
  },
  Alert: {
    alert: () => {},
  },
};
