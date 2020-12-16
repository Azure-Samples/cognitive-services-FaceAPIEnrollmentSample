import * as constants from '../../shared/constants';
import {CONFIG} from '../../env/env.json';
var RNFS = require('react-native-fs');
import {setUserInfo} from './saveUserInfoAction';
import {log} from '../../shared/helper';

export const checkEnrollmentExistsAction = (username) => {
  return async (dispatch) => {
    /*
        This app writes to the enrollment directory path for demonstration only.
        Store existing enrollment information in a secured database. 
    */
    let path = RNFS.DocumentDirectoryPath + '/enrollment/' + username + '.txt';
    let fileExists = await RNFS.exists(path);
    if (fileExists) {
      let mapping = await RNFS.readFile(path, 'utf8');
      if (mapping && mapping != '') {
        let personGroup = mapping.split(',')[0];
        let personId = mapping.split(',')[1];

        if (
          personGroup == CONFIG.PERSONGROUP_RGB &&
          personId &&
          personId != ''
        ) {
          let userInfo = {
            username: username,
            personIdRgb: personId,
            personidIr: '',
          };

          dispatch(setUserInfo(userInfo));
          return true;
        }
      }
    }

    return false;
  };
};

export const newEnrollmentAction = () => {
  return async (dispatch) => {
    // Create a new personId for a re-enrollment
    // old personId will be deleted

    let infoSaved = true;

    let personId;

    let createPersonRgbEndpoint =
      constants.FACEAPI_ENDPOINT +
      constants.PERSON_ENDPOINT(CONFIG.PERSONGROUP_RGB);

    let requestBody = {name: 'person-name'};
    let response = await fetch(createPersonRgbEndpoint, {
      method: 'POST',
      headers: {
        'User-Agent': constants.USER_AGENT,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status == '200') {
      let result = await response.text();
      personId = JSON.parse(result).personId;
      log('new pid', personId);

      infoSaved = true;
    } else {
      log('Create person failure: ', response);
      infoSaved = false;
    }

    let newIds = {
      personIdRgb: personId,
      personidIr: '',
    };

    dispatch(setNewIds(newIds));
    return infoSaved;
  };
};

// Deletes a person from large person group
export const deleteEnrollmentAction = () => {
  return async (dispatch, getState) => {
    // Select the newer personId if it was a re-enrollment
    // otherwise select the only personId
    let newPersonId = getState().newEnrollment.newRgbPersonId;
    let personId =
      newPersonId && newPersonId != ''
        ? newPersonId
        : getState().userInfo.rgbPersonId;

    if (!personId || personId == '') {
      log('pid is empty');
      return false;
    }

    let username = getState().userInfo.username;
    let path = RNFS.DocumentDirectoryPath + '/enrollment/' + username + '.txt';

    // Delete person
    let deletePersonEndpoint =
      constants.FACEAPI_ENDPOINT +
      constants.GET_PERSON_ENDPOINT(CONFIG.PERSONGROUP_RGB, personId);

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
      log('pid deleted');

      // only delete file if this was new enrollment
      if (personId != newPersonId) {
        RNFS.unlink(path)
          .then(() => {
            log('FILE DELETED');
          })
          .catch((err) => {
            log(err.message);
          });
      }

      return true;
    }

    if (response.status == '404') {
      let result = await response.text();
      let deleteResult = JSON.parse(result);
      log('delete result', deleteResult);

      if (deleteResult.error.message.includes('Person is not found.')) {
        return false;
      }
    }

    // Error occured
    throw new Error('Error deleting prints: ', response.status);
  };
};

// Deletes the old enrollment if it was a re-enrollment
export const deleteOldEnrollmentAction = () => {
  return async (dispatch, getState) => {
    let personIdOld = getState().userInfo.rgbPersonId;
    log('personId old', personIdOld);
    let personIdNew = getState().newEnrollment.newRgbPersonId;
    log('personId new', personIdNew);

    if (
      !personIdOld ||
      personIdOld == '' ||
      !personIdNew ||
      personIdNew == ''
    ) {
      log('pid is empty');
      return false;
    }

    let username = getState().userInfo.username;
    let path = RNFS.DocumentDirectoryPath + '/enrollment/' + username + '.txt';

    // Delete person
    let deletePersonEndpoint =
      constants.FACEAPI_ENDPOINT +
      constants.GET_PERSON_ENDPOINT(CONFIG.PERSONGROUP_RGB, personIdOld);

    let response = await fetch(deletePersonEndpoint, {
      method: 'DELETE',
      headers: {
        'User-Agent': constants.USER_AGENT,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Ocp-Apim-Subscription-Key': constants.FACEAPI_KEY,
      },
    });

    log('delete status', response.status);

    if (response.status == '200') {
      // delete file
      RNFS.unlink(path)
        .then(() => {
          log('FILE DELETED');
        })
        .catch((err) => {
          log(err.message);
        });

      let mappingData = CONFIG.PERSONGROUP_RGB + ',' + personIdNew;
      log('new mapping ', mappingData);

      RNFS.writeFile(path, mappingData, 'utf8')
        .then((success) => {
          log('FILE WRITTEN');
        })
        .catch((err) => {
          log(err.message);
        });

      return true;
    }

    if (response.status == '404') {
      let result = await response.text();
      let deleteResult = JSON.parse(result);
      log('delete result', deleteResult);

      if (deleteResult.error.message.includes('Person is not found.')) {
        return false;
      }
    }

    // Error occured
    throw new Error('Error deleting prints: ', response.status);
  };
};

export const setNewIds = (userInfo) => ({
  type: 'SAVE_NEW_ENROLLMENT',
  payload: userInfo,
});
