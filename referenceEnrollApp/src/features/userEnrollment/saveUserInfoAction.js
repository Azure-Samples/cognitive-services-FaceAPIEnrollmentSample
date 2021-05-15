import {CONFIG} from '../../env/env.json';
import {Platform} from 'react-native';
import * as constants from '../../shared/constants';

var RNFS;
if (Platform.OS != 'windows') {
  RNFS = require('react-native-fs');
}

export const saveUserInfoAction = (username) => {
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
      existingPersonIdRgb = await findExistingEnrollment(
        username,
        CONFIG.PERSONGROUP_RGB,
      );
      if (!existingPersonIdRgb || existingPersonIdRgb == '') {
        isReEnrollment = false;
        console.log('RGB enrollment not found');
      } else {
        console.log('RGB enrollment found: ', existingPersonIdRgb);
      }
    }

    if (CONFIG.ENROLL_SETTINGS.IR_FRAMES_TOENROLL > 0) {
      existingPersonIdIr = await findExistingEnrollment(
        username,
        CONFIG.PERSONGROUP_IR,
      );
      if (!existingPersonIdIr || existingPersonIdIr == '') {
        isReEnrollment = false;
        console.log('IR enrollment not found.');
      } else {
        console.log('IR enrollment found: ', existingPersonIdIr);
      }
    }

    // save data
    let userInfo = {
      username: username,
      personIdRgb: existingPersonIdRgb,
      personIdIr: existingPersonIdIr,
    };

    console.log('Saving userInfo: ', userInfo);

    dispatch(setUserInfo(userInfo));

    console.log('Is reenrollment: ', isReEnrollment);
    return isReEnrollment;
  };
};

const findExistingEnrollment = async (username, personGroup) => {
  /*
      This app reads/writes to the enrollment directory path for demonstration only.
      Store existing enrollment information in a secured database. 
  */

  let personId = '';

  if (Platform.OS == 'windows') {
    console.log(constants.EnrollDict);
    var mapping = constants.EnrollDict[username];
    console.log('mapping', mapping);
    if (mapping && mapping != '') {
      personId = constants.EnrollDict[username][personGroup];
      console.log('existing pid', personId);
    }
  } else {
    let path =
      RNFS.DocumentDirectoryPath +
      '/enrollment/' +
      username +
      '/' +
      personGroup +
      '.txt';
    let fileExists = await RNFS.exists(path);
    if (fileExists) {
      let value = await RNFS.readFile(path, 'utf8');
      if (value && value != '') {
        personId = value;
      }
    }
  }

  return personId;
};

export const setUserInfo = (userInfo) => ({
  type: 'SAVE_USERINFO',
  payload: userInfo,
});
