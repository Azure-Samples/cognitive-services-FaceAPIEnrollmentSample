import 'react-native';
import React from 'react';
import {create, act} from 'react-test-renderer';
import Welcome from '../../src/features/screens/Welcome';
import Consent from '../../src/features/screens/Consent';
import Instruction from '../../src/features/screens/Instruction';
import ImageCapture from '../../src/features/screens/ImageCapture';
import Receipt from '../../src/features/screens/Receipt';
import ManageProfile from '../../src/features/screens/ManageProfile';
import {SCREENS} from '../../src/shared/constants';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import configureMockStore from 'redux-mock-store';
import Login from '../../src/features/screens/Login';
import '@testing-library/jest-native/extend-expect';
import {StackActions} from '@react-navigation/native';

// Mocked store for screen component tests
const mockStore = configureMockStore();
const store = mockStore({
  userInfo: {rgbPersonId: 123},
  newEnrollment: {},
  feedback: {message: ''},
  newEnrollment: {},
});

// Mocked functions for testing navigation
const navigate = jest.fn();
const setOptions = jest.fn();
const dispatch = jest.fn();

// Mock fetch so person group check succeeds
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    status: 200,
    text: function () {
      return JSON.stringify('');
    },
  }),
);

describe('Welcome screen', () => {
  it('renders correctly', () => {
    const tree = create(
      <Provider store={store}>
        <Welcome navigation={{navigate}} />
      </Provider>,
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('navigates to consent page', () => {
    const {getByText} = render(
      <Provider store={store}>
        <Welcome navigation={{navigate}} />
      </Provider>,
    );
    fireEvent.press(getByText('Get started'));
    expect(navigate).toHaveBeenCalledWith(SCREENS.consent);
  });

  it('navigates to login page', () => {
    const {getByText} = render(
      <Provider store={store}>
        <Welcome navigation={{navigate}} />
      </Provider>,
    );
    fireEvent.press(getByText('Manage profile'));
    expect(navigate).toHaveBeenCalledWith(SCREENS.login, {
      nextScreen: SCREENS.manage,
    });
  });
});

describe('Consent screen', () => {
  it('navigates to login', () => {
    const {getByText} = render(
      <Consent navigation={{navigate, setOptions}}></Consent>,
    );
    fireEvent.press(getByText('Yes, create my face template'));
    expect(navigate).toHaveBeenCalledWith(SCREENS.login, {
      nextScreen: SCREENS.instruction,
    });
  });

  it('navigates back to welcome', async () => {
    const {getByText, findByText, queryByText} = render(
      <Consent navigation={{dispatch, setOptions}}></Consent>,
    );

    let modal = queryByText('Got it');
    expect(modal).toBeNull();

    fireEvent.press(getByText('No, don’t create my face template'));

    modal = await findByText('Got it');
    expect(modal).toBeTruthy();

    fireEvent.press(getByText('Close'));
    expect(dispatch).toHaveBeenCalledWith(StackActions.popToTop());
  });
});

describe('Login screen', () => {
  it('requires username input', async () => {
    const {getByText, queryByText} = render(
      <Provider store={store}>
        <Login
          navigation={{setOptions}}
          route={{params: {nextScreen: SCREENS.instruction}}}
        />
      </Provider>,
    );

    await act(async () => {
      fireEvent.press(getByText('Sign In'));
    });

    let modal = getByText('Sign-in failed');
    expect(modal).toBeTruthy();

    fireEvent.press(getByText('Try Again'));

    modal = queryByText('Sign-in failed');
    expect(modal).toBeNull();
  });
});

describe('Instructions screen', () => {
  it('navigates to image capture screen', () => {
    const {getByText} = render(
      <Provider store={store}>
        <Instruction navigation={{navigate, setOptions}} />
      </Provider>,
    );

    fireEvent.press(getByText('Create my face template now'));
    expect(navigate).toHaveBeenCalledWith(SCREENS.imageCapture);
  });
});

describe('Receipt screen', () => {
  it('renders correctly', () => {
    const rendered = create(
      <Receipt navigation={{navigate, setOptions}} />,
    ).toJSON();
    expect(rendered).toBeTruthy();
  });

  it('navigates back to welcome', () => {
    const {getByText} = render(<Receipt navigation={{dispatch, setOptions}} />);

    fireEvent.press(getByText('Back to home'));
    expect(dispatch).toHaveBeenCalledWith(StackActions.popToTop());
  });
});

describe('Manage profile screen', () => {
  it('renders correctly', () => {
    const rendered = create(
      <Provider store={store}>
        <ManageProfile navigation={{navigate, setOptions}} />
      </Provider>,
    ).toJSON();
    expect(rendered).toBeTruthy();
  });
});
