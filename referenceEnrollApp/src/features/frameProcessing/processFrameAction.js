import {getLargestFace, getTargetFace, sleep} from '../../shared/helper';
import {enrollFeedbackAction} from '../feedback/enrollFeedbackAction';
import {CONFIG} from '../../env/env.json';
import * as constants from '../../shared/constants';
import {filterFaceAction} from '../filtering/qualityFilteringAction';
import {FEEDBACK} from '../filtering/filterFeedback';
import {mutex} from '../../shared/constants';

// Gets largest face from frame and enrolls
export const processFrameForEnrollmentAction = async (frameData) => {
  return async (dispatch) => {
    let t1 = performance.now();
    let face = await Promise.resolve(
      dispatch(await detectFaceAction(frameData)),
    );
    let t2 = performance.now();

    console.log('detection time:', t2 - t1);
    if (face.faceId) {
      let t3 = performance.now();

      // Attempts to enroll face
      // add a mutex

      let release = await mutex.acquire();
      console.log('lock enabled');

      let res = await Promise.resolve(
        dispatch(await processFaceAction(face, frameData)),
      );

      release();

      console.log('lock disabled');

      let t4 = performance.now();

      console.log('enrollment time', t4 - t3);

      return res;
    }
    // No face detected, no face enrolled
    return false;
  };
};

// Gets largest face from frame and enrolls
export const processFrameForEnrollmentAction2 = (frames) => {
  return async (dispatch) => {
    let t1 = performance.now();
    // spawn x detect calls to get filterd faces array
    let filteredFaces = await Promise.resolve(
      dispatch(await getFilteredFaces(frames)),
    );
    console.log('filteredFaces:', filteredFaces.length);
    let t2 = performance.now();
    console.log('total detection time:', t2 - t1);

    var enrolled = 0;
    let t3 = performance.now();
    for (var faceFrame of filteredFaces) {
      //console.log(faceFrame);
      if (faceFrame) {
        console.log('enrolling one frame');
        // Attempts to enroll face
        let res = await Promise.resolve(
          dispatch(await processFaceAction(faceFrame[0], faceFrame[1])),
        );

        enrolled = res ? ++enrolled : enrolled;
      }
    }

    let t4 = performance.now();

    console.log('enrollment time', t4 - t3);

    // if (face.faceId) {
    //   let t3 = performance.now();

    //   // Attempts to enroll face
    //   let res = await Promise.resolve(
    //     dispatch(await processFaceAction(face, frameData)),
    //   );
    //   let t4 = performance.now();

    //   console.log('enrollment time', t4 - t3);

    //   return res;
    // }
    // No face detected, no face enrolled
    return enrolled;
  };
};

// Gets largest face from frame and verifies
export const processFrameForVerifyAction = async (frameData) => {
  return async (dispatch) => {
    let t1 = performance.now();
    let face = await Promise.resolve(
      dispatch(await detectFaceAction(frameData)),
    );

    let t2 = performance.now();
    console.log('detection time:', t2 - t1);

    if (face.faceId) {
      // Attempts to verify face

      let t3 = performance.now();
      var res = await Promise.resolve(
        dispatch(await verifyFaceAction(face, frameData)),
      );

      let t4 = performance.now();
      console.log('verify time', t4 - t3);
      return res;
    }
    // No face detected, no face verified
    return false;
  };
};

export const getFilteredFaces = (frames) => {
  return async (dispatch) => {
    var getFilteredFace = async (frame) => {
      var face = await Promise.resolve(dispatch(await detectFaceAction(frame)));
      if (face.faceId) {
        let passedFilters = dispatch(filterFaceAction(face));
        if (passedFilters) {
          return face;
        }
      }
      return {};
    };

    var getFilteredFaces = [];
    for (var frame of frames) {
      var getFaceFrame = new Promise(async (resolve) => {
        var face = await getFilteredFace(frame);
        if (face.faceId) {
          return resolve([face, frame]);
        }
        return resolve();
      });

      console.log('Pushing', getFaceFrame);
      getFilteredFaces.push(getFaceFrame);
    }

    console.log('detect calls all run');
    var t1 = performance.now();
    var res = await Promise.all(getFilteredFaces);
    var t2 = performance.now();
    console.log('all ran', t2 - t1);
    return res;
  };
};

// Detects a face
export const detectFaceAction = async (frameData) => {
  return async (dispatch) => {
    // Detect face
    let detectEndpoint =
      constants.FACEAPI_ENDPOINT +
      constants.DETECT_ENDPOINT +
      '?' +
      constants.FACE_ATTRIBUTES +
      '&' +
      constants.REC_MODEL;

    let response = await fetch(detectEndpoint, {
      method: 'POST',
      headers: {
        'User-Agent': constants.USER_AGENT,
        'Content-Type': 'application/octet-stream',
        Accept: 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
      },
      body: frameData,
    });

    if (response.status == '200') {
      let result = await response.text();
      let detectResult = JSON.parse(result);
      let faceToEnroll = getLargestFace(detectResult);

      console.log('faceToEnroll: ', faceToEnroll);

      // If no face, report no face detected
      if (!faceToEnroll.faceId) {
        // dispatch no face detected message
        dispatch(enrollFeedbackAction(FEEDBACK.noFaceDetected));
        // return empty face object
        console.log('No face detected');
        return {};
      } else {
        console.log('Face found');
        return faceToEnroll;
      }
    } else {
      console.log('Detect failure: ', response);
      let result = await response.text();
      console.log(result);
      // return empty face object
      return {};
    }
  };
};

// Enrolls a face
export const processFaceAction = async (face, frameData) => {
  return async (dispatch, getState) => {
    console.log('adding face');
    // // Run quality filters
    // let t1 = performance.now();

    // let passedFilters = dispatch(filterFaceAction(face));
    // let t2 = performance.now();
    // console.log('quality filter time', t2 - t1);
    // if (passedFilters == false) {
    //   // Face failed filters, do not enroll
    //   return Promise.resolve(false);
    // }

    // If re-enrollment, use the new personId
    let newPersonId = getState().newEnrollment.newRgbPersonId;
    let personId =
      newPersonId && newPersonId != ''
        ? newPersonId
        : getState().userInfo.rgbPersonId;

    // Add face
    let addFaceEndpoint =
      constants.FACEAPI_ENDPOINT +
      constants.ADD_FACE_ENDPOINT(CONFIG.PERSONGROUP_RGB, personId) +
      '?targetFace=' +
      getTargetFace(face);

    let response = await fetch(addFaceEndpoint, {
      method: 'POST',
      headers: {
        'User-Agent': constants.USER_AGENT,
        'Content-Type': 'application/octet-stream',
        Accept: 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
      },
      body: frameData,
    });

    console.log('AddFace status', response.status);
    if (response.status == '200') {
      return Promise.resolve(true);
    } else {
      let result = await response.text();
      console.log('AddFace Failure', result);
      dispatch(enrollFeedbackAction("Couldn't enroll photo"));
      return Promise.resolve(false);
    }
  };
};

// Verfies a face
export const verifyFaceAction = async (face) => {
  return async (dispatch, getState) => {
    // Run quality filters
    let t1 = performance.now();

    let passedFilters = dispatch(filterFaceAction(face));
    let t2 = performance.now();
    console.log('quality filter time', t2 - t1);

    if (passedFilters == false) {
      // Face failed filters, do not enroll
      return Promise.resolve(false);
    }

    dispatch(enrollFeedbackAction(FEEDBACK.verifying));

    // If re-enrollment, use the new personId
    let newPersonId = getState().newEnrollment.newRgbPersonId;
    let personId =
      newPersonId && newPersonId != ''
        ? newPersonId
        : getState().userInfo.rgbPersonId;

    // Verify
    let verifyEndpoint = constants.FACEAPI_ENDPOINT + constants.VERIFY_ENDPOINT;

    let requestBody = {
      faceId: face.faceId,
      personId: personId,
      largePersonGroupId: CONFIG.PERSONGROUP_RGB,
    };

    let response = await fetch(verifyEndpoint, {
      method: 'POST',
      headers: {
        'User-Agent': constants.USER_AGENT,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Verify response', response);

    if (response.status == '200') {
      let result = await response.text();
      let verifyResult = JSON.parse(result);

      if (
        verifyResult.isIdentical == true &&
        verifyResult.confidence >= CONFIG.ENROLL_SETTINGS.VERIFY_CONFIDENCE
      ) {
        return Promise.resolve(true);
      }
    }

    dispatch(enrollFeedbackAction("Couldn't verify photo"));
    return Promise.resolve(false);
  };
};

// Trains person group
export const trainAction = async () => {
  return async (dispatch, getState) => {
    let maxAttempts = CONFIG.ENROLL_SETTINGS.TRAIN_ATTEMPTS;
    const maxStatusChecks = 50;

    for (let trainAttempts = 0; trainAttempts < maxAttempts; trainAttempts++) {
      console.log('train attempt ', trainAttempts);
      // Train
      let tainEndpoint =
        constants.FACEAPI_ENDPOINT +
        constants.TRAIN_ENDPOINT(CONFIG.PERSONGROUP_RGB);

      let response = await fetch(tainEndpoint, {
        method: 'POST',
        headers: {
          'User-Agent': constants.USER_AGENT,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
        },
      });

      // If train was accepted, check status
      if (response.status == '202') {
        let trainFailed = false;
        for (
          let statusAttempts = 0;
          statusAttempts < maxStatusChecks && trainFailed == false;
          statusAttempts++
        ) {
          console.log('train status attempt ', statusAttempts);

          // Get training status
          let tainStatusEndpoint =
            constants.FACEAPI_ENDPOINT +
            constants.TRAIN_STATUS_ENDPOINT(CONFIG.PERSONGROUP_RGB);

          let response = await fetch(tainStatusEndpoint, {
            method: 'GET',
            headers: {
              'User-Agent': constants.USER_AGENT,
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
            },
          });

          if (response.status == '200') {
            let result = await response.text();
            let trainingResult = JSON.parse(result);
            if (trainingResult.status == 'succeeded') {
              // Training finished and succeeded
              return true;
            }

            trainFailed = trainingResult.status == 'failed';
          }
          // Wait between status checks
          await sleep(100);
        }
      }

      // Wait between train attempts
      await sleep(100);
    }

    // Training has failed
    return false;
  };
};
