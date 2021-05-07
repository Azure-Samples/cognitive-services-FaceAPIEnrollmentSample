import * as constants from '../../shared/constants';
import {CONFIG} from '../../env/env.json';
var RNFS;
if (Platform.OS != 'windows') {
  RNFS = require('react-native-fs');
}

import {createPerson, setUserInfo} from './saveUserInfoAction';
import {Platform} from 'react-native';

export const checkIfReEnrollment = (username) => {
  return async (dispatch) => {
    /*
      for RGB only or IR only enrollment:
        - If no personId found, method returns false.
      for both RGB and IR enrollment: 
        - If RGB & IR personIds found, method returns true.
        - If neither RGB nor IR personId found, method returns false. 
        - If only one of RGB or IR personId is found, the method returns false.
          This is considered a new enrollment. For example, if RGB personId found, 
          and IR personId is not found, new personIds are created for both RGB and IR,
          and the old personID for RGB is deleted. If a failure occurs during enrollment,
          it is a no-op. 
    */

    let isReEnrollment = true;
    let existingPersonIdRgb = '';
    let existingPersonIdIr = '';

    if (CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL > 0) {
      existingPersonIdRgb = await findEnrollmentAction(
        username,
        CONFIG.PERSONGROUP_RGB,
      );
      if (!existingPersonIdRgb || existingPersonIdRgb == '') {
        isReEnrollment = false;
      }
    }

    if (CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL > 0) {
      existingPersonIdIr = await findEnrollmentAction(
        username,
        CONFIG.PERSONGROUP_IR,
      );
      if (!existingPersonIdIr || existingPersonIdIr == '') {
        isReEnrollment = false;
      }
    }

    // save data
    let userInfo = {
      username: username,
      personIdRgb: existingPersonIdRgb,
      personidIr: existingPersonIdIr,
    };

    dispatch(setUserInfo(userInfo));

    return isReEnrollment;
  };
};

export const findEnrollmentAction = (username, personGroup) => {
  return async (dispatch) => {
    /*
        This app reads/writes to the enrollment directory path for demonstration only.
        Store existing enrollment information in a secured database. 
    */

    let personId = '';

    if (Platform.OS == 'windows') {
      var mapping = constants.EnrollDict.username;
      if (mapping) {
        personId = constants.EnrollDict.username[personGroup];
      }
    } else {
      let path =
        RNFS.DocumentDirectoryPath + '/enrollment/' + username + '/' + personGroup + '.txt';
      let fileExists = await RNFS.exists(path);
      if (fileExists) {
        let mapping = await RNFS.readFile(path, 'utf8');
        if (mapping && mapping != '') {
          mappedPersonGroup = mapping.split(',')[0];
          if (mappedPersonGroup == personGroup) {
            personId = mapping.split(',')[1];
          }
        }
      }
    }

    return personId;
  };
};

export const newEnrollmentAction = () => {
  return async (dispatch) => {
    // Create a new personId for a re-enrollment
    // old personId will be deleted

    let newPersonIdRgb = '';
    let newPersonIdIr = '';

    if (CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL > 0) {
      newPersonIdRgb = createPerson(CONFIG.PERSONGROUP_RGB);
    }

    if (CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL > 0) {
      newPersonIdIr = createPerson(CONFIG.PERSONGROUP_IR);
    }

    let newIds = {
      personIdRgb: newPersonIdRgb,
      personIdIr: newPersonIdIr,
    };

    dispatch(setNewIds(newIds));
    return infoSaved;
  };
};

// Deletes a person from large person group
export const deleteCurrentEnrollmentAction = (personGroup, personId) => {
  return async (dispatch, getState) => {

    let username = getState().userInfo.username;
    let deleted = deletePerson(personGroup, personId);

    if (deleted) {
      console.log('pid deleted');

        // only delete file if this was new enrollment
        if (Platform.OS == 'windows') {
          let savedPersonId = constants.EnrollDict.username[personGroup];
          if(personId == savedPersonId){
            // delete
            constants.EnrollDict.username[personGroup] = undefined;
          }
        } else {
          let path =
            RNFS.DocumentDirectoryPath + '/enrollment/' + username + "/" + personGroup + '.txt';
          let savedPersonId = RNFS.readFile();
          if(personId == savedPersonId){
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

      return false;
  };
};

function deletePerson(personGroup, personId){
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

    if( response.status == '200'){
      return true;
    }
    else if (response.status == '404') {
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

// Deletes the old enrollment if it was a re-enrollment
export const updateEnrollmentAction = (personGroup, personIdOld, personIdNew) => {
  return async (dispatch, getState) => {
    
    let username = getState().userInfo.username;

    let deleted = deletePerson(personGroup, personIdOld);

    if (deleted) {
      // update saved info
      if (Platform.OS == 'windows') {
        constants.EnrollDict.username[personGroup] = personIdNew;
      } else {
        let path =
          RNFS.DocumentDirectoryPath + '/enrollment/' + username + '/' + personGroup + '.txt';

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
};

export const setNewIds = (userInfo) => ({
  type: 'SAVE_NEW_ENROLLMENT',
  payload: userInfo,
});
