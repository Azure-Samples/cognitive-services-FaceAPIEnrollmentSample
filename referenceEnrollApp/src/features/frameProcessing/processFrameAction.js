import {getLargestFace, getTargetFace, sleep} from '../../shared/helper';
import {enrollFeedbackAction} from '../feedback/enrollFeedbackAction';
import {CONFIG} from '../../env/env.json';
import * as constants from '../../shared/constants';
import {
  filterFaceActionRgb,
  filterFaceActionIr,
} from '../filtering/qualityFilteringAction';
import {FEEDBACK} from '../filtering/filterFeedback';

// Detects and Filters faces
export const getFilteredFaceforRgbAction = (frameData) => {
  return async (dispatch) => {
    console.log('detection rgb called');
    let face = await dispatch(
      detectFaceAction(
        frameData,
        constants.REC_MODEL_RGB,
        constants.FACE_ATTRIBUTES_RGB,
      ),
    );
    if (face.faceId) {
      console.log('Rgb face found');
      let passedFilters = dispatch(filterFaceActionRgb(face));
      console.log('Passed RGB: ', passedFilters);
      return passedFilters ? face : {};
    }
    return {};
  };
};

// Detects and Filters faces
export const getFilteredFaceForIrAction = (frameData) => {
  return async (dispatch) => {
    //return {};
    console.log('detection for IR.');
    let face = await dispatch(
      detectFaceAction(
        frameData,
        constants.REC_MODEL_IR,
        constants.FACE_ATTRIBUTES_IR,
      ),
    );
    if (face.faceId) {
      console.log('IR face found');
      let passedFilters = dispatch(filterFaceActionIr(face));
      console.log('Passed IR: ', passedFilters);
      return passedFilters ? face : {};
    }
    return {};
  };
};

// Detects a face
export const detectFaceAction = (
  frameData,
  recognitionModel,
  faceAttributes,
) => {
  return async (dispatch) => {
    // Detect face
    let detectEndpoint =
      constants.FACEAPI_ENDPOINT +
      constants.DETECT_ENDPOINT +
      '?' +
      faceAttributes +
      '&' +
      recognitionModel;

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

      // If no face, report no face detected
      if (!faceToEnroll.faceId) {
        // dispatch no face detected message
        dispatch(enrollFeedbackAction(FEEDBACK.noFaceDetected));
        // return empty face object
        return {};
      } else {
        return faceToEnroll;
      }
    } else {
      let result = await response.text();
      let detectResult = JSON.parse(result);
      console.log('Detect failure: ', detectResult);
      // return empty face object
      return {};
    }
  };
};

// Enrolls a face
export const processFaceAction = (face, frameData, personGroup, personId) => {
  return async (dispatch, getState) => {
    // Add face
    let addFaceEndpoint =
      constants.FACEAPI_ENDPOINT +
      constants.ADD_FACE_ENDPOINT(personGroup, personId) +
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

    console.log(
      'AddFace status for persongroup: ',
      personGroup,
      response.status,
    );

    if (response.status == '200') {
      return true;
    } else {
      let result = await response.text();
      console.log('AddFace Failure', result);
      dispatch(enrollFeedbackAction("Couldn't enroll photo"));
      return false;
    }
  };
};

// Verfies a face
export const verifyFaceAction = (face, personGroup, personId) => {
  return async (dispatch, getState) => {
    dispatch(enrollFeedbackAction(FEEDBACK.verifying));

    // Verify
    let verifyEndpoint = constants.FACEAPI_ENDPOINT + constants.VERIFY_ENDPOINT;

    let requestBody = {
      faceId: face.faceId,
      personId: personId,
      largePersonGroupId: personGroup,
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
        return true;
      }
    }

    dispatch(enrollFeedbackAction("Couldn't verify photo"));
    return false;
  };
};

// Trains person group
export const trainAction = () => {
  return async (dispatch, getState) => {
    let success = true;
    if (CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL > 0) {
      success &= await train(CONFIG.PERSONGROUP_RGB);
    }

    if (CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL > 0) {
      success &= await train(CONFIG.PERSONGROUP_IR);
    }

    return success;
  };
};

async function train(personGroup) {
  let maxAttempts = CONFIG.ENROLL_SETTINGS.TRAIN_ATTEMPTS;
  const maxStatusChecks = 50;

  for (let trainAttempts = 0; trainAttempts < maxAttempts; trainAttempts++) {
    console.log('train attempt ', trainAttempts);
    // Train
    let tainEndpoint =
      constants.FACEAPI_ENDPOINT + constants.TRAIN_ENDPOINT(personGroup);

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
}
