module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'transform-inline-environment-variables',
      {
        include: ['NODE_ENV', 'FACEAPI_ENDPOINT', 'FACEAPI_KEY'],
      },
    ],
  ],
};
