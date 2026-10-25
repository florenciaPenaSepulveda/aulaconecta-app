const { configure } = require('@testing-library/react-native');

configure({ asyncUtilTimeout: 5000 });
jest.setTimeout(30000);
