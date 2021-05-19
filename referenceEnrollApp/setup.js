jest.mock('react-native-fs', () => {
  return {
    mkdir: jest.fn(),
    exists: jest.fn(),
    writeFile: jest.fn(() => Promise.resolve(true)),
    DocumentDirectoryPath: '',
    unlink: jest.fn(() => Promise.resolve(true)),
  };
});

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');
