module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*|@react-native-async-storage|react-redux|@reduxjs|immer|redux|reselect|redux-thunk|swr)/)',
  ],
};
