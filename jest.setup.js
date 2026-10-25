jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => {
  const memoria = new Map();
  return {
    getItemAsync: jest.fn(async (key) => (memoria.has(key) ? memoria.get(key) : null)),
    setItemAsync: jest.fn(async (key, value) => {
      memoria.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key) => {
      memoria.delete(key);
    }),
    __vaciar: () => memoria.clear(),
  };
});

jest.mock('./src/lib/alerts', () => ({
  ...jest.requireActual('./src/lib/alerts'),
  notify: jest.fn(),
  confirmAction: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
