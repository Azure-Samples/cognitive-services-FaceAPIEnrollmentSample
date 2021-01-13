import 'react-native';
import React from 'react';
import {
  createPersonResult,
  createPersonErrorResult,
} from '../testData/personResult.json';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {saveUserInfoAction} from '../../src/features/userEnrollment/saveUserInfoAction';
import {
  deleteEnrollmentAction,
  deleteOldEnrollmentAction,
  newEnrollmentAction,
} from '../../src/features/userEnrollment/newEnrollmentAction';

describe('User enrollment unit tests', () => {
  // Mock Store
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  const store = mockStore({
    userInfo: {rgbPersonId: 123},
    newEnrollment: {newRgbPersonId: 234},
  });

  // Mock addPerson responses
  const addPersonResponse = {
    status: '200',
    text: function () {
      return JSON.stringify(createPersonResult);
    },
  };

  const addPersonErrorResponse = {
    status: '400',
    text: function () {
      return JSON.stringify(createPersonErrorResult);
    },
  };

  // Save user information
  it('saveUserInfoAction - success ', async () => {
    const store = mockStore({
      userInfo: {rgbPersonId: 123},
      newEnrollment: {newRgbPersonId: 234},
    });
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(addPersonResponse));

    let savedInfo = await store.dispatch(saveUserInfoAction('username'));
    // Expect person to be created and information saved in store
    expect(savedInfo).toBeTruthy();
    let expectedAction = [
      {
        type: 'SAVE_USERINFO',
        payload: {
          username: 'username',
          personIdRgb: createPersonResult.personId,
          personidIr: '',
        },
      },
    ];

    expect(store.getActions()).toEqual(expectedAction);
  });

  it('saveUserInfoAction - failure ', async () => {
    const store = mockStore({
      userInfo: {rgbPersonId: 123},
      newEnrollment: {newRgbPersonId: 234},
    });
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(addPersonErrorResponse));

    let savedInfo = await store.dispatch(saveUserInfoAction('username'));
    expect(savedInfo).toBeFalsy();
    let expectedAction = [
      {
        type: 'SAVE_USERINFO',
        payload: {
          username: 'username',
          personIdRgb: '',
          personidIr: '',
        },
      },
    ];
    expect(store.getActions()).toEqual(expectedAction);
  });

  // New enrollment
  it('newEnrollmentAction - success ', async () => {
    const store = mockStore({
      userInfo: {rgbPersonId: 123},
      newEnrollment: {newRgbPersonId: 234},
    });
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(addPersonResponse));

    let savedInfo = await store.dispatch(newEnrollmentAction());
    expect(savedInfo).toBeTruthy();
    let expectedAction = [
      {
        type: 'SAVE_NEW_ENROLLMENT',
        payload: {
          personIdRgb: createPersonResult.personId,
          personIdIr: '',
        },
      },
    ];

    expect(store.getActions()).toEqual(expectedAction);
  });

  it('newEnrollmentAction - failure ', async () => {
    const store = mockStore({
      userInfo: {rgbPersonId: 123},
      newEnrollment: {newRgbPersonId: 234},
    });
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(addPersonErrorResponse));

    let savedInfo = await store.dispatch(newEnrollmentAction());
    expect(savedInfo).toBeFalsy();
    let expectedAction = [
      {
        type: 'SAVE_NEW_ENROLLMENT',
        payload: {
          personIdRgb: '',
          personIdIr: '',
        },
      },
    ];

    expect(store.getActions()).toEqual(expectedAction);
  });

  // Delete current enrollment
  it('deleteEnrollmentAction - success ', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve({status: '200'}));

    let deleted = await store.dispatch(deleteEnrollmentAction());
    expect(deleted).toBeTruthy();
  });

  it('deleteEnrollmentAction - no person exists ', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: '404',
        text: function () {
          return JSON.stringify({
            error: {
              code: 'PersonNotFound',
              message: 'Person is not found.',
            },
          });
        },
      }),
    );

    let deleted = await store.dispatch(deleteEnrollmentAction());
    expect(deleted).toBeFalsy();
  });

  it('deleteEnrollmentAction - throws error ', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: '400',
        text: function () {
          return '{}';
        },
      }),
    );

    store
      .dispatch(deleteEnrollmentAction())
      .catch((error) => expect(error).toMatch('Error deleting prints: 400'));
  });

  // Delete prior enrollment
  it('deleteOldEnrollmentAction - success ', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve({status: '200'}));

    let deleted = await store.dispatch(deleteOldEnrollmentAction());
    expect(deleted).toBeTruthy();
  });

  it('deleteOldEnrollmentAction - no person exists ', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: '404',
        text: function () {
          return JSON.stringify({
            error: {
              code: 'PersonNotFound',
              message: 'Person is not found.',
            },
          });
        },
      }),
    );

    let deleted = await store.dispatch(deleteOldEnrollmentAction());
    expect(deleted).toBeFalsy();
  });

  it('deleteOldEnrollmentAction - throws error ', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: '400',
        text: function () {
          return '{}';
        },
      }),
    );

    store
      .dispatch(deleteOldEnrollmentAction())
      .catch((error) => expect(error).toMatch('Error deleting prints: 400'));
  });

  it('deleteOldEnrollmentAction - pid is empty ', async () => {
    const store = mockStore({
      userInfo: {},
      newEnrollment: {newRgbPersonId: 234},
    });

    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: '400',
        text: function () {
          return '{}';
        },
      }),
    );

    let deleted = await store.dispatch(deleteOldEnrollmentAction());
    expect(deleted).toBeFalsy();
  });
});
