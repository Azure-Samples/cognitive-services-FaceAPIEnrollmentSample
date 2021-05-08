import * as constants from '../../shared/constants';
import {CONFIG} from '../../env/env.json';
var RNFS;
if (Platform.OS != 'windows') {
  RNFS = require('react-native-fs');
}

import {createPerson, setUserInfo} from './saveUserInfoAction';
import {Platform} from 'react-native';

export const newEnrollmentAction = () => {
  return async (dispatch, getState) => {

    let createdPersonIdRgb = "";
    let createdPersonIdIr = "";

    if(CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL > 0){
      createdPersonIdRgb = createPerson(CONFIG.PERSONGROUP_RGB);
      if(!createdPersonIdRgb || createdPersonIdRgb == ''){
        return false;
      }
    }

    if(CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL > 0){
      createdPersonIdIr = createPerson(CONFIG.PERSONGROUP_IR);
      if(!createdPersonIdIr || createdPersonIdIr == ''){
        return false;
      }
    }

    let newEnrollment = {
      personIdRgb: createdPersonIdRgb,
      personIdIr: createdPersonIdIr,
    };

    dispatch(setNewIds(newEnrollment));
    return true;
  };
};

export const updateEnrollmentAction =  async () => {
  return async (dispatch, getState) => {

    let existingPersonIdRgb = getState().userInfo.existingPersonIdRgb;
    let existingPersonIdIr= getState().userInfo.existingPersonIdIr;
    let username = getState().userInfo.username;

    let newPersonIdRgb = getState().newEnrollment.newPersonIdRgb;
    let newPersonIdIr = getState().newEnrollment.newPersonIdIr;

    let success = true;

    if(existingPersonIdRgb && existingPersonIdRgb != ''){
      // Reenrollment, update data
      success &= await updateEnrollment(username, CONFIG.PERSONGROUP_RGB, existingPersonIdRgb, newPersonIdRgb);
    }
    else if(newPersonIdRgb && newPersonIdRgb != ''){
      // First time enrolling, save data
      success &= await saveEnrollment(username, CONFIG.PERSONGROUP_RGB, newPersonIdRgb);
    }

    if(existingPersonIdIr && existingPersonIdIr != '' ){
      success &= await updateEnrollment(username, CONFIG.PERSONGROUP_IR, existingPersonIdIr, newPersonIdIr);
    }
    else if(newPersonIdIr && newPersonIdIr != '') {
      success &= await saveEnrollment(username, CONFIG.PERSONGROUP_IR, newPersonIdIr);
    }

    return success;
  };
};

export const deleteNewEnrollmentsAction = async () => {
  return async (dispatch, getState) => {
    let personIdRgb = getState().newEnrollment.newPersonIdRgb;
    let personIdIr = getState().newEnrollment.newPersonIdIr;
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

function createPerson(personGroup) {
  let createPersonEndpoint =
  constants.FACEAPI_ENDPOINT +
  constants.PERSON_ENDPOINT(personGroup);

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
    personId = JSON.parse(result).personId;
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

    if(!personIdNew || personIdNew == '' ){
      return false;
    }

    let deleted = await deletePerson(personGroup, personIdOld);

    if (deleted) {
      // update saved info
      if (Platform.OS == 'windows') {
        constants.EnrollDict.username[personGroup] = personIdNew;
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
  let path =
  RNFS.DocumentDirectoryPath + '/enrollment/' + username + '/' + personGroup + '.txt';

  if (Platform.OS == 'windows') {
    constants.EnrollDict.username = username;
    constants.EnrollDict.username[personGroup] = personId;
  } else {
    try {
      await RNFS.writeFile(path, personId, 'utf8');
      console.log('FILE WRITTEN');
    } catch (error) {
      console.log('Error writing file', error.message);
      return false;
    }
  }

  return true;
}

// Deletes a person from large person group
// const deleteEnrollment = async (username, personGroup, personId) => {
//   let deleted = await deletePerson(personGroup, personId);

//   if (deleted) {
//     console.log('pid deleted');

//     // only delete file if this was new enrollment
//     if (Platform.OS == 'windows') {
//       let savedPersonId = constants.EnrollDict.username[personGroup];
//       if (personId == savedPersonId) {
//         // delete
//         constants.EnrollDict.username[personGroup] = undefined;
//       }
//     } else {
//       let path =
//         RNFS.DocumentDirectoryPath +
//         '/enrollment/' +
//         username +
//         '/' +
//         personGroup +
//         '.txt';
//       let savedPersonId = RNFS.readFile();
//       if (personId == savedPersonId) {
//         RNFS.unlink(path)
//           .then(() => {
//             console.log('FILE DELETED');
//           })
//           .catch((err) => {
//             console.log(err.message);
//           });
//       }
//     }

//     return true;
//   }

//   return false;
// };

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
    return true;
  } else if (response.status == '404') {
    let result = await response.text();
    let deleteResult = JSON.parse(result);
    console.log('delete result', deleteResult);

    if (deleteResult.error.message.includes('Person is not found.')) {
      return false;
    }
  }

  // Error occured
  throw new Error('Error deleting prints: ', response.status);
}

export const setNewIds = (userInfo) => ({
  type: 'SAVE_NEW_ENROLLMENT',
  payload: userInfo,
});
