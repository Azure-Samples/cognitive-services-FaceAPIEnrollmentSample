import * as constants from '../../shared/constants';
import {CONFIG} from '../../env/env.json';
import {Platform} from 'react-native';
var RNFS;
if (Platform.OS != 'windows') {
  RNFS = require('react-native-fs');
}

export const saveUserInfoAction = (username) => {
  return async (dispatch, getState) => {
    let infoSaved = true;
    let personId;

    let path;

    if (Platform.OS == 'windows') {
      console.log('hereeee');
      var mapping = constants.EnrollDict.username;
      console.log(mapping);
      if (mapping) {
        personId = constants.EnrollDict.username[CONFIG.PERSONGROUP_RGB];
      }
    } else {
      path = RNFS.DocumentDirectoryPath + '/enrollment/' + username + '.txt';
      console.log('path', path);
      let fileExists = await RNFS.exists(path);
      if (fileExists) {
        console.log('exists');
        let mapping = await RNFS.readFile(path, 'utf8');
        console.log('mapping', mapping);

        if (mapping && mapping != '') {
          personId = mapping.split(',')[1];
        }
      }
    }

    if (!personId) {
      let createPersonRgbEndpoint =
        constants.FACEAPI_ENDPOINT +
        constants.PERSON_ENDPOINT(CONFIG.PERSONGROUP_RGB);

      let requestBody = {name: 'person-name'};
      let response = await fetch(createPersonRgbEndpoint, {
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

        let mappingdata = CONFIG.PERSONGROUP_RGB + ',' + personId;

        if (Platform.OS == 'windows') {
          constants.EnrollDict.username = username;
          constants.EnrollDict.username[CONFIG.PERSONGROUP_RGB] = personId;
        } else {
          try {
            await RNFS.writeFile(path, mappingdata, 'utf8');
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
    }

    let userInfo = {
      username: username,
      personIdRgb: !personId ? '' : personId,
      personidIr: '',
    };
    console.log(constants.EnrollDict);
    dispatch(setUserInfo(userInfo));
    return infoSaved;
  };
};

export const setUserInfo = (userInfo) => ({
  type: 'SAVE_USERINFO',
  payload: userInfo,
});
