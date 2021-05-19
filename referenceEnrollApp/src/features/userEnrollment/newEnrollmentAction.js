import * as constants from '../../shared/constants';
import {CONFIG} from '../../env/env.json';
var RNFS;
if (Platform.OS != 'windows') {
  RNFS = require('react-native-fs');
}

import {Platform} from 'react-native';

export const newEnrollmentAction = () => {
  return async (dispatch) => {
    let createdPersonIdRgb = '';
    let createdPersonIdIr = '';
    let result = true;

    if (CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL > 0) {
      createdPersonIdRgb = await createPerson(CONFIG.PERSONGROUP_RGB);
      if (!createdPersonIdRgb || createdPersonIdRgb == '') {
        result &= false;
      }
    }

    if (CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL > 0) {
      createdPersonIdIr = await createPerson(CONFIG.PERSONGROUP_IR);
      if (!createdPersonIdIr || createdPersonIdIr == '') {
        result &= false;
      }
    }

    let newEnrollment = {
      personIdRgb: createdPersonIdRgb,
      personIdIr: createdPersonIdIr,
    };

    console.log('New Enrollment: ', newEnrollment);

    dispatch(setNewIds(newEnrollment));
    return result;
  };
};

export const updateEnrollmentAction = () => {
  return async (dispatch, getState) => {
    let existingPersonIdRgb = getState().userInfo.existingRgbPersonId;
    let existingPersonIdIr = getState().userInfo.existingIrPersonId;
    let username = getState().userInfo.username;

    let newPersonIdRgb = getState().newEnrollment.newRgbPersonId;
    let newPersonIdIr = getState().newEnrollment.newIrPersonId;
    let success = true;

    if (existingPersonIdRgb && existingPersonIdRgb != '') {
      // Reenrollment, update data
      success &= await updateEnrollment(
        username,
        CONFIG.PERSONGROUP_RGB,
        existingPersonIdRgb,
        newPersonIdRgb,
      );
    } else if (newPersonIdRgb && newPersonIdRgb != '') {
      // First time enrolling, save data
      success &= await saveEnrollment(
        username,
        CONFIG.PERSONGROUP_RGB,
        newPersonIdRgb,
      );
    }

    if (existingPersonIdIr && existingPersonIdIr != '') {
      success &= await updateEnrollment(
        username,
        CONFIG.PERSONGROUP_IR,
        existingPersonIdIr,
        newPersonIdIr,
      );
    } else if (newPersonIdIr && newPersonIdIr != '') {
      success &= await saveEnrollment(
        username,
        CONFIG.PERSONGROUP_IR,
        newPersonIdIr,
      );
    }

    return success;
  };
};

export const deleteNewEnrollmentsAction = () => {
  return async (dispatch, getState) => {
    let personIdRgb = getState().newEnrollment.newRgbPersonId;
    let personIdIr = getState().newEnrollment.newIrPersonId;
    console.log('deleting', personIdIr, personIdRgb);
    let deletedSuccessfully = true;

    if (personIdRgb && personIdRgb != '') {
      deletedSuccessfully &= await deletePerson(
        CONFIG.PERSONGROUP_RGB,
        personIdRgb,
      );
    }

    if (personIdIr && personIdIr != '') {
      deletedSuccessfully &= await deletePerson(
        CONFIG.PERSONGROUP_IR,
        personIdIr,
      );
    }

    return deletedSuccessfully;
  };
};

async function createPerson(personGroup) {
  let createPersonEndpoint =
    constants.FACEAPI_ENDPOINT + constants.PERSON_ENDPOINT(personGroup);

  let requestBody = {name: 'person-name'};
  let response = await fetch(createPersonEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status == '200') {
    let result = await response.text();
    let personId = JSON.parse(result).personId;
    console.log('new pid', personId);
    return personId;
  } else {
    console.log('Create person failure: ', response);
    return '';
  }
}

// Deletes the existing enrollment if it was a re-enrollment, and updates save info
const updateEnrollment = async (
  username,
  personGroup,
  personIdOld,
  personIdNew,
) => {
  if (!personIdNew || personIdNew == '') {
    return false;
  }

  let deleted = await deletePerson(personGroup, personIdOld);

  if (deleted) {
    // update saved info
    if (Platform.OS == 'windows') {
      constants.EnrollDict[username][personGroup] = personIdNew;
    } else {
      let path =
        RNFS.DocumentDirectoryPath +
        '/enrollment/' +
        username +
        '/' +
        personGroup +
        '.txt';

      RNFS.unlink(path)
        .then(() => {
          console.log('FILE DELETED');
        })
        .catch((err) => {
          console.log(err.message);
        });

      console.log('new mapping ', personGroup, personIdNew);

      RNFS.writeFile(path, personIdNew, 'utf8')
        .then((success) => {
          console.log('FILE WRITTEN');
        })
        .catch((err) => {
          console.log(err.message);
        });

      return true;
    }
  }
  return false;
};

// saves enrollment info for first enrollment
const saveEnrollment = async (username, personGroup, personId) => {
  console.log('saving enrollment data...');
  if (Platform.OS == 'windows') {
    if (constants.EnrollDict[username] == null) {
      constants.EnrollDict[username] = {};
    }
    constants.EnrollDict[username][personGroup] = personId;

    console.log(constants.EnrollDict);
  } else {
    let path = RNFS.DocumentDirectoryPath + '/enrollment/' + username;
    if ((await RNFS.exists(path)) == false) {
      RNFS.mkdir(path);
    }
    try {
      let file = path + '/' + personGroup + '.txt';

      await RNFS.writeFile(file, personId, 'utf8');
      console.log('FILE WRITTEN', path, file);
    } catch (error) {
      console.log('Error writing file', error.message);
      return false;
    }
  }

  return true;
};

export const deleteExistingEnrollmentsAction = () => {
  return async (dispatch, getState) => {
    let personIdRgb = getState().userInfo.existingRgbPersonId;
    let personIdIr = getState().userInfo.existingIrPersonId;
    let username = getState().userInfo.username;
    console.log('deleting', personIdIr, personIdRgb);
    let deletedSuccessfully = true;

    if (personIdRgb && personIdRgb != '') {
      deletedSuccessfully &= await deletePerson(
        CONFIG.PERSONGROUP_RGB,
        personIdRgb,
      );
    }

    if (personIdIr && personIdIr != '') {
      deletedSuccessfully &= await deletePerson(
        CONFIG.PERSONGROUP_IR,
        personIdIr,
      );
    }

    if (deletedSuccessfully) {
      // deleted saved info
      if (Platform.OS == 'windows') {
        delete constants.EnrollDict[username];
      } else {
        if (personIdRgb && personIdRgb != '') {
          deleteFile(username, CONFIG.PERSONGROUP_RGB);
        }
        if (personIdIr && personIdIr != '') {
          deleteFile(username, CONFIG.PERSONGROUP_IR);
        }
      }
    }

    return deletedSuccessfully;
  };
};

async function deletePerson(personGroup, personId) {
  let deletePersonEndpoint =
    constants.FACEAPI_ENDPOINT +
    constants.GET_PERSON_ENDPOINT(personGroup, personId);

  let response = await fetch(deletePersonEndpoint, {
    method: 'DELETE',
    headers: {
      'User-Agent': constants.USER_AGENT,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
    },
  });

  if (response.status == '200') {
    console.log('deleted person successfully: ', personId);
    return true;
  } else if (response.status == '404') {
    let result = await response.text();
    let deleteResult = JSON.parse(result);
    console.log('delete error', deleteResult);

    if (deleteResult.error.message.includes('Person is not found.')) {
      return false;
    }
  }

  // Error occured
  throw new Error('Error deleting prints: ', response.status);
}

function deleteFile(username, personGroup) {
  let path =
    RNFS.DocumentDirectoryPath +
    '/enrollment/' +
    username +
    '/' +
    personGroup +
    '.txt';

  RNFS.unlink(path)
    .then(() => {
      console.log('FILE DELETED');
      return true;
    })
    .catch((err) => {
      console.log(err.message);
      return false;
    });
}

export const setNewIds = (userInfo) => ({
  type: 'SAVE_NEW_ENROLLMENT',
  payload: userInfo,
});
