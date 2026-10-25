jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('./src/lib/alerts', () => ({
  ...jest.requireActual('./src/lib/alerts'),
  notify: jest.fn(),
  confirmAction: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
