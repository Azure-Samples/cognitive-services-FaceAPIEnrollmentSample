/**
 * @format
 */

import 'react-native';
import React from 'react';
import App from '../src/app/App';
import {act, create} from 'react-test-renderer';

// Silences warnings
jest.mock('react-native/Libraries/Animated/src/NativeAnimatedHelper');

it('renders correctly', async () => {
  const result = create(<App />);
  await act(async () => {
    expect(result).toMatchSnapshot();
  });
});
