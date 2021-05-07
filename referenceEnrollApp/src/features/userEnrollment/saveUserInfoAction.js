import * as constants from '../../shared/constants';
import {CONFIG} from '../../env/env.json';
import {Platform} from 'react-native';
var RNFS;
if (Platform.OS != 'windows') {
  RNFS = require('react-native-fs');
}

export const createPersonsAction = (username) => {
  return async (dispatch, getState) => {
    let infoSaved = true;

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

    let userInfo = {
      username: username,
      personIdRgb: createdPersonIdRgb,
      personidIr: createdPersonIdIr,
    };

    dispatch(setUserInfo(userInfo));
    return true;
  };
};

export function createPerson(personGroup) {
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

    let path =
    RNFS.DocumentDirectoryPath + '/enrollment/' + username + '/' + personGroup + '.txt';

    if (Platform.OS == 'windows') {
      constants.EnrollDict.username = username;
      constants.EnrollDict.username[personGroup] = personId;
    } else {
      try {
        await RNFS.writeFile(path, personId, 'utf8');
        console.log('FILE WRITTEN');
        infoSaved = true;
      } catch (error) {
        console.log('Error writing file', error.message);
        infoSaved = false;
      }
    }
  } else {
    console.log('Create person failure: ', response);
    infoSaved = false;
  }

  return infoSaved? personId : ''
}

export const setUserInfo = (userInfo) => ({
  type: 'SAVE_USERINFO',
  payload: userInfo,
});
