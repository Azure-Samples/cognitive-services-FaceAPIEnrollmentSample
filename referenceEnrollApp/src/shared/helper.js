import * as constants from './constants';
import {CONFIG} from '../env/env.json';

function getLargestFace(detectResponse) {
  /* 
    According to FaceAPI detect :
    A successful call returns an array of face entries
    ranked by face rectangle size in descending order.
  */
  if (detectResponse.length > 0) {
    // return first face in array
    return detectResponse[0];
  }

  return {};
}

function getTargetFace(detectResponse) {
  /*
    formats targetFace request parameter
    for FaceAPI add face.
    targetFace=left,top,width,height
    */
  let targetFace = '';
  let rect = detectResponse.faceRectangle;
  if (rect) {
    targetFace =
      rect.left + ',' + rect.top + ',' + rect.width + ',' + rect.height;
  }

  return targetFace;
}

async function validatePersonGroup(personGroupId) {
  // Create person group if it doesn't exist
  let personGroupExists = false;
  try {
    personGroupExists = await checkPersonGroupExists(personGroupId);
    if (personGroupExists === false) {
      personGroupExists = await createPersonGroup(personGroupId);
    }
  } catch {
    return false;
  }

  console.log('personGroupExists:', personGroupExists);
  return personGroupExists;
}

async function validatePersonGroups() {
  let validated = true;

  if (CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL > 0) {
    validated &= await validatePersonGroup(CONFIG.PERSONGROUP_RGB);
  }

  if (CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL > 0) {
    validated &= await validatePersonGroup(CONFIG.PERSONGROUP_IR);
  }

  return validated;
}

async function checkPersonGroupExists(personGroupId) {
  let getPersonGroupEndpoint =
    constants.FACEAPI_ENDPOINT + constants.PERSONGROUP_ENDPOINT(personGroupId);

  let response = await fetch(getPersonGroupEndpoint, {
    method: 'GET',
    headers: {
      'User-Agent': constants.USER_AGENT,
      'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
    },
  });

  let result = await response.text();
  let body = JSON.parse(result);

  if (
    response.status == '404' &&
    body.error &&
    body.error.message.includes('Large person group is not found.')
  ) {
    console.log('person group not found');
    return false;
  } else if (response.status != '200') {
    throw new Error('failed to get person group');
  }

  return true;
}

async function createPersonGroup(personGroupId) {
  let createPersonGroupEndpoint =
    constants.FACEAPI_ENDPOINT + constants.PERSONGROUP_ENDPOINT(personGroupId);

  let requestBody = {
    name: 'large-person-group-name',
    userData: 'User-provided data attached to the large person group.',
    recognitionModel: CONFIG.RECOGNITION_MODEL_RGB,
  };

  let response = await fetch(createPersonGroupEndpoint, {
    method: 'PUT',
    headers: {
      'User-Agent': constants.USER_AGENT,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status != '200') {
    return false;
  }

  return true;
}

async function deletePersonGroup(personGroupId) {
  let createPersonGroupEndpoint =
    constants.FACEAPI_ENDPOINT + constants.PERSONGROUP_ENDPOINT(personGroupId);

  let response = await fetch(createPersonGroupEndpoint, {
    method: 'DELETE',
    headers: {
      'User-Agent': constants.USER_AGENT,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
    },
  });

  if (response.status != '200') {
    return false;
  }

  return true;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CancellationToken {
  constructor() {
    this.isCancellationRequested = false;
    this.isTimeoutCancellation = false;
  }
  cancel() {
    this.isCancellationRequested = true;
  }
  timeoutCancel() {
    this.isCancellationRequested = true;
    this.isTimeoutCancellation = true;
  }
}

export {
  getLargestFace,
  deletePersonGroup,
  validatePersonGroups,
  validatePersonGroup,
  getTargetFace,
  sleep,
  CancellationToken,
};
