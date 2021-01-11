jest.mock('react-native-fs', () => {
  return {
    mkdir: jest.fn(),
    exists: jest.fn(),
    writeFile: jest.fn(() => Promise.resolve(true)),
    DocumentDirectoryPath: '',
    unlink: jest.fn(() => Promise.resolve(true)),
  };
});
