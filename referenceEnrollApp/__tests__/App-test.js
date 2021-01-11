/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../src/app/App';
// Note: test renderer must be required after react-native.
import {act, create} from 'react-test-renderer';

// Silences warnings
jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');

it('renders correctly', async () => {
  // render the app
  const result = create(<App />);
  await act(async () => {
    expect(result).toMatchSnapshot();
  });
});
