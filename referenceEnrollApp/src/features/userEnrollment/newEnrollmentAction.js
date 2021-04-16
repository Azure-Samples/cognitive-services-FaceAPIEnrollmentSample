import * as constants from '../../shared/constants';
import {CONFIG} from '../../env/env.json';
var RNFS;
if (Platform.OS != 'windows') {
  RNFS = require('react-native-fs');
}

import {setUserInfo} from './saveUserInfoAction';
import {Platform} from 'react-native';

export const checkEnrollmentExistsAction = (username) => {
  return async (dispatch) => {
    /*
        This app writes to the enrollment directory path for demonstration only.
        Store existing enrollment information in a secured database. 
    */

    let personGroup = '';
    let personId = '';

    if (Platform.OS == 'windows') {
      var mapping = constants.EnrollDict.username;
      if (mapping) {
        personId = constants.EnrollDict.username[CONFIG.PERSONGROUP_RGB];
        personGroup = CONFIG.PERSONGROUP_RGB;
      }
    } else {
      let path =
        RNFS.DocumentDirectoryPath + '/enrollment/' + username + '.txt';
      let fileExists = await RNFS.exists(path);
      if (fileExists) {
        let mapping = await RNFS.readFile(path, 'utf8');
        if (mapping && mapping != '') {
          personGroup = mapping.split(',')[0];
          personId = mapping.split(',')[1];
        }
      }
    }

    if (personGroup == CONFIG.PERSONGROUP_RGB && personId && personId != '') {
      let userInfo = {
        username: username,
        personIdRgb: personId,
        personidIr: '',
      };

      dispatch(setUserInfo(userInfo));
      return true;
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
      console.log('new pid', personId);

      infoSaved = true;
    } else {
      console.log('Create person failure: ', response);
      infoSaved = false;
    }

    let newIds = {
      personIdRgb: !personId ? '' : personId,
      personIdIr: '',
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
      console.log('pid is empty');
      return false;
    }

    let username = getState().userInfo.username;

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
      console.log('pid deleted');

      // only delete file if this was new enrollment
      if (personId != newPersonId) {
        if (Platform.OS == 'windows') {
          constants.EnrollDict.username[CONFIG.PERSONGROUP_RGB] = undefined;
        } else {
          let path =
            RNFS.DocumentDirectoryPath + '/enrollment/' + username + '.txt';
          RNFS.unlink(path)
            .then(() => {
              console.log('FILE DELETED');
            })
            .catch((err) => {
              console.log(err.message);
            });
        }
      }

      return true;
    }

    if (response.status == '404') {
      let result = await response.text();
      let deleteResult = JSON.parse(result);
      console.log('delete result', deleteResult);

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
    console.log('personId old', personIdOld);
    let personIdNew = getState().newEnrollment.newRgbPersonId;
    console.log('personId new', personIdNew);

    if (
      !personIdOld ||
      personIdOld == '' ||
      !personIdNew ||
      personIdNew == ''
    ) {
      console.log('pid is empty');
      return false;
    }

    let username = getState().userInfo.username;

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

    console.log('delete status', response.status);

    if (response.status == '200') {
      // delete file
      if (Platform.OS == 'windows') {
        constants.EnrollDict.username[CONFIG.PERSONGROUP_RGB] = personIdNew;
      } else {
        let path =
          RNFS.DocumentDirectoryPath + '/enrollment/' + username + '.txt';

        RNFS.unlink(path)
          .then(() => {
            console.log('FILE DELETED');
          })
          .catch((err) => {
            console.log(err.message);
          });

        let mappingData = CONFIG.PERSONGROUP_RGB + ',' + personIdNew;
        console.log('new mapping ', mappingData);

        RNFS.writeFile(path, mappingData, 'utf8')
          .then((success) => {
            console.log('FILE WRITTEN');
          })
          .catch((err) => {
            console.log(err.message);
          });
      }

      return true;
    }

    if (response.status == '404') {
      let result = await response.text();
      let deleteResult = JSON.parse(result);
      console.log('delete result', deleteResult);

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
