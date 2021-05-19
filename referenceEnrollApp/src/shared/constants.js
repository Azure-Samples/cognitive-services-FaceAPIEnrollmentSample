import UserAgent from 'react-native-user-agent';
import {CONFIG} from '../env/env.json';
import {requireNativeComponent} from 'react-native';

import {
  createQualityFilterRgb,
  createQualityFilterIr,
} from '../features/filtering/filters';
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
export const FACE_ATTRIBUTES_RGB =
  'returnFaceAttributes=headPose,occlusion,glasses,accessories,blur,exposure,noise';

export const FACE_ATTRIBUTES_IR = 'returnFaceAttributes=headPose,exposure';

export const REC_MODEL_RGB = 'recognitionModel=' + CONFIG.RECOGNITION_MODEL_RGB;
export const REC_MODEL_IR = 'recognitionModel=' + CONFIG.RECOGNITION_MODEL_IR;

export const QUALITY_FILTER_RGB = createQualityFilterRgb();
export const QUALITY_FILTER_IR = createQualityFilterIr();

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
  with the app. For a production scenario, storing any key or secret as an environment 
  variable is NOT secure. Do NOT create a release build of this app with 
  FaceAPI key stored as an environment variable. Follow the best security 
  practices in the documentation for further recommendations.
*/

export var FACEAPI_ENDPOINT = process.env.FACEAPI_ENDPOINT;
export var FACEAPI_KEY = process.env.FACEAPI_KEY;

export const mutexForRgb = new Mutex();
export const mutexForIr = new Mutex();

export var EnrollDict = {};

//export var Cam = requireNativeComponent('WindowsCameraView');
