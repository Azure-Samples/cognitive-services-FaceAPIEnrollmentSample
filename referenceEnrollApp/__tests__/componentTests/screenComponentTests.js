import 'react-native';
import React from 'react';
import {create, act} from 'react-test-renderer';
import Welcome from '../../src/features/screens/Welcome';
import Consent from '../../src/features/screens/Consent';
import {SCREENS} from '../../src/shared/constants';
import {render, fireEvent} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import configureMockStore from 'redux-mock-store';
import {NavigationContainer} from '@react-navigation/native';
import Login from '../../src/features/screens/Login';
import '@testing-library/jest-native/extend-expect';

describe('Welcome screen', () => {
  const mockStore = configureMockStore();
  const store = mockStore({userInfo: {rgbPersonId: 123}, newEnrollment: {}});
  const navigate = jest.fn();

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
  const navigate = jest.fn();
  const setOptions = jest.fn();

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
    // replace with poptotop
    const dispatch = jest.fn();
    const setOptions = jest.fn();

    const {getByText, findByText, queryByText} = render(
      <Consent navigation={{dispatch, setOptions}}></Consent>,
    );

    const popToTop = jest.fn();

    let modal = queryByText('Got it');
    expect(modal).toBeNull(); // it doesn't exist

    fireEvent.press(getByText('No, don’t create my face template'));

    modal = await findByText('Got it');
    expect(modal).toBeTruthy();

    fireEvent.press(getByText('Close'));
    expect(dispatch).toHaveBeenCalled();
  });
});

describe('Login screen', () => {
  const setOptions = jest.fn();
  const mockStore = configureMockStore();
  const store = mockStore({userInfo: {rgbPersonId: 123}, newEnrollment: {}});

  it('requires username input', async () => {
    const {getByText, queryByText} = render(
      <Provider store={store}>
        <Login
          navigation={{setOptions}}
          route={{params: {nextScreen: SCREENS.instruction}}}
        />
      </Provider>,
    );

    //fireEvent.changeText(getByPlaceholderText('Username'), 'guest');
    let res = fireEvent.press(getByText('Sign In'));
    await act(async () => {
      res;
    });

    let modal = getByText('Sign-in failed');
    expect(modal).toBeTruthy();

    fireEvent.press(getByText('Try Again'));

    modal = queryByText('Sign-in failed');
    expect(modal).toBeNull();
  });
});
