import UserAgent from 'react-native-user-agent';
import {CONFIG} from '../env/env.json';

import createQualityFilter from '../features/filtering/filters';
import {Mutex} from 'async-mutex';

const ROOT = 'face/v1.0/';

export const DETECT_ENDPOINT = ROOT + 'detect/';

export const PERSONGROUP_ENDPOINT = (personGroupId) => {
  return ROOT + 'largepersongroups/' + personGroupId;
};

export const PERSON_ENDPOINT = (personGroupId) => {
  return PERSONGROUP_ENDPOINT(personGroupId) + '/persons/';
};

export const GET_PERSON_ENDPOINT = (personGroupId, personId) => {
  return PERSON_ENDPOINT(personGroupId) + personId;
};

export const ADD_FACE_ENDPOINT = (personGroupId, personId) => {
  return GET_PERSON_ENDPOINT(personGroupId, personId) + '/persistedfaces';
};

export const TRAIN_ENDPOINT = (personGroupId) => {
  return PERSONGROUP_ENDPOINT(personGroupId) + '/train';
};

export const TRAIN_STATUS_ENDPOINT = (personGroupId) => {
  return PERSONGROUP_ENDPOINT(personGroupId) + '/training';
};

export const VERIFY_ENDPOINT = ROOT + 'verify';

// face attributes to retrieve from FaceAPI
export const FACE_ATTRIBUTES =
  'returnFaceAttributes=headPose,occlusion,glasses,accessories,blur,exposure,noise';

export const REC_MODEL = 'recognitionModel=' + CONFIG.RECOGNITION_MODEL_RGB;

export const QUALITY_FILTER = createQualityFilter();

export const ENROLL_RESULT = Object.freeze({
  success: 0,
  successNoTrain: 1,
  cancel: 2,
  timeout: 3,
  error: 4,
});

export const SCREENS = Object.freeze({
  welcome: 'Welcome',
  consent: 'Consent',
  login: 'LogIn',
  instruction: 'Instruction',
  imageCapture: 'ImageCapture',
  receipt: 'Receipt',
  manage: 'Manage',
});

export const USER_AGENT =
  'ReferenceEnrollmentApp/20.11.20 ' +
  UserAgent.systemName +
  UserAgent.systemVersion;

/*
  For demo purposes, this app stores the FaceAPI endpoint and key 
  as environment variables. This is ok for local testing and getting started 
  with the app. For a production scenario, storing any key or secret as a environment 
  variable is NOT secure. Do NOT create a release build of this app with 
  FaceAPI key stored as an environment variable. Follow the best security 
  practices in the documentation for further recommendations.
*/

export const FACEAPI_ENDPOINT = process.env.FACEAPI_ENDPOINT;
export var FACEAPI_KEY = '';

export const mutex = new Mutex();
