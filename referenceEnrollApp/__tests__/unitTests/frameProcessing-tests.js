import 'react-native';
import {
  detectionResult,
  noFaceDetectedResult,
  errorResult,
} from '../testData/detectResult.json';
import {
  verifyResultIdentical,
  verifyResultNotIdentical,
} from '../testData/verifyResult.json';
import {
  detectFaceAction,
  getFilteredFaceforRgbAction,
  processFaceAction,
  trainAction,
  verifyFaceAction,
} from '../../src/features/frameProcessing/processFrameAction';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {CONFIG} from '../../src/env/env.json';
import * as constants from '../../src/shared/constants';

describe('Frame processing unit tests', () => {
  const face = detectionResult[0];
  const frameData = '';

  // Mock Store
  const middlewares = [thunk];
  const mockStore = configureMockStore(middlewares);
  const store = mockStore({
    userInfo: {},
    newEnrollment: {newgRgbPersonId: 123},
  });

  // Mock detect responses
  const detectResponse = {
    status: '200',
    text: function () {
      return JSON.stringify(detectionResult);
    },
  };

  const noFaceDetectedResponse = {
    status: '200',
    text: function () {
      return JSON.stringify(noFaceDetectedResult);
    },
  };

  const errorResponse = {
    status: '400',
    text: function () {
      return JSON.stringify(errorResult);
    },
  };

  // Detection
  it('detectFaceAction - face detected ', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(detectResponse));

    let face = await store.dispatch(
      detectFaceAction(
        frameData,
        constants.REC_MODEL_RGB,
        constants.FACE_ATTRIBUTES_RGB,
      ),
    );
    expect(face.faceId).toBeDefined();
  });

  it('detectFaceAction - no face detected ', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(noFaceDetectedResponse));

    let face = await store.dispatch(
      detectFaceAction(
        frameData,
        constants.REC_MODEL_RGB,
        constants.FACE_ATTRIBUTES_RGB,
      ),
    );
    expect(face.faceId).toBeUndefined();
  });

  it('detectFaceAction - error response ', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(errorResponse));

    let face = await store.dispatch(
      detectFaceAction(
        frameData,
        CONFIG.RECOGNITION_MODEL_RGB,
        constants.FACE_ATTRIBUTES_RGB,
      ),
    );
    expect(face.faceId).toBeUndefined();
  });

  // ProcessFace
  it('processFaceAction - success ', async () => {
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve({status: 200}));

    let res = await store.dispatch(
      processFaceAction(face, frameData, CONFIG.PERSONGROUP_RGB, 123),
    );
    expect(res).toBeTruthy();
  });

  it('processFaceAction - failure ', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: 400,
        text: function () {
          return '{}';
        },
      }),
    );

    let res = await store.dispatch(
      processFaceAction(face, frameData, CONFIG.PERSONGROUP_RGB, 123),
    );
    expect(res).toBeFalsy();
  });

  // Filter Face
  it('getFilteredFaceAction - pass ', async () => {
    detectionResult[0].faceAttributes.accessories = [];
    detectResponse.text = function () {
      return JSON.stringify(detectionResult);
    };
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(detectResponse));

    let face = await store.dispatch(getFilteredFaceforRgbAction(frameData));
    expect(face.faceId).toBeDefined();
  });

  it('getFilteredFaceAction - fail ', async () => {
    detectionResult[0].faceAttributes.noise.value = 0.5;

    global.fetch = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve(detectResponse));

    let face = await store.dispatch(getFilteredFaceforRgbAction(frameData));
    expect(face.faceId).toBeUndefined();
  });

  // Verify
  it('verifyFaceAction - identical success ', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        text: function () {
          return JSON.stringify(verifyResultIdentical);
        },
      }),
    );

    let res = await store.dispatch(
      verifyFaceAction(face, CONFIG.PERSONGROUP_RGB, 123),
    );
    expect(res).toBeTruthy();
  });

  it('verifyFaceAction - not identical success ', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        text: function () {
          return JSON.stringify(verifyResultNotIdentical);
        },
      }),
    );

    let res = await store.dispatch(
      verifyFaceAction(face, CONFIG.PERSONGROUP_RGB, 123),
    );
    expect(res).toBeFalsy();
  });

  it('verifyFaceAction - error response ', async () => {
    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        status: 400,
        text: function () {
          return '';
        },
      }),
    );

    let res = await store.dispatch(
      verifyFaceAction(face, CONFIG.PERSONGROUP_RGB, 123),
    );
    expect(res).toBeFalsy();
  });

  // Train
  it('trainAction - success', async () => {
    // train
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 202,
        }),
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 200,
          text: function () {
            return JSON.stringify({status: 'succeeded'});
          },
        }),
      );

    let res = await store.dispatch(trainAction());
    expect(res).toBeTruthy();
  });

  it('trainAction - failure', async () => {
    // train
    global.fetch = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({
          status: 202,
        }),
      )
      .mockImplementation(() =>
        Promise.resolve({
          status: 200,
          text: function () {
            return JSON.stringify({status: 'failed'});
          },
        }),
      );

    let res = await store.dispatch(trainAction());
    expect(res).toBeFalsy();
  });
});
