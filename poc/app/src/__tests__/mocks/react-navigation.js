// Mock @react-navigation/native + @react-navigation/native-stack
const React = require('react');

const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
};

const route = {
  params: {},
  key: 'test',
  name: 'Test',
};

module.exports = {
  NavigationContainer: ({ children }) => React.createElement('View', null, children),
  useNavigation: () => navigation,
  useRoute: () => route,
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => React.createElement('View', null, children),
    Screen: ({ children }) => React.createElement('View', null, children),
  }),
};
