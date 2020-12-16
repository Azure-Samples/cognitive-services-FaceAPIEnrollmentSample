import React, {useEffect, useState} from 'react';

import {View, StyleSheet, Dimensions, ImageBackground} from 'react-native';
import {Caption, Headline, Subheading1} from '../../styles/fontStyles';
import CustomButton from '../../styles/CustomButton';
import {CONFIG} from '../../env/env.json';
import {useDispatch} from 'react-redux';
import * as constants from '../../shared/constants';
import {deletePersonGroup} from '../../shared/helper';
import {Directions} from 'react-native-gesture-handler';
var RNFS = require('react-native-fs');
import {validatePersonGroup, log} from '../shared/helper';

function Welcome({navigation}) {
  let dispatch = useDispatch();

  const checkIsPortrait = () => {
    const dim = Dimensions.get('window');
    return dim.height >= dim.width;
  };

  const [isPortrait, setIsPortrait] = useState(checkIsPortrait());

  useEffect(() => {
    const orientationCallback = () => {
      setIsPortrait(checkIsPortrait());
    };
    Dimensions.addEventListener('change', orientationCallback);

    validatePersonGroup(CONFIG.PERSONGROUP_RGB).then((personGroupValidated) => {
      if (personGroupValidated === false) {
        navigation.navigate('Settings');
      }
    });

    return () => {
      Dimensions.removeEventListener('change', orientationCallback);
    };
  }, []);

  // This is for testing purposes
  const clearAllData = () => {
    RNFS.readDir(RNFS.DocumentDirectoryPath + '/enrollment/')
      .then((result) => {
        log('files', result);

        // stat the first file
        return result;
      })
      .then((result) => {
        for (let item of result) {
          if (item.isFile()) {
            log('deleting', item.path);
            RNFS.unlink(item.path);
          }
        }
      })
      .catch((err) => {
        log(err.message, err.code);
      });

    deletePersonGroup(CONFIG.PERSONGROUP_RGB).then((res) => {
      log('Delete result:', res);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <ImageBackground
          source={require('../../assets/bg_heroIllustration_welcome.png')}
          style={styles.backgroundImage}
        />
        {isPortrait ? <View style={styles.backgroundBottom} /> : <View />}
      </View>

      <View style={isPortrait ? styles.boxContainerP : styles.boxContainerL}>
        <View
          style={
            isPortrait ? [styles.whiteBox, {height: '50%'}] : styles.whiteBox
          }>
          <View style={{flex: 1, justifyContent: 'flex-start'}}>
            <Caption style={styles.greyText}>
              Contoso | Real Estate & Security
            </Caption>
          </View>

          <View style={styles.infoView}>
            <View style={styles.textPadding}>
              <Headline>An easier way to get into work</Headline>
            </View>
            <Subheading1 style={styles.greyText}>
              You can now use face recognition instead of your badge to
              conveniently unlock building doors.
            </Subheading1>
          </View>

          <View style={styles.buttons}>
            <CustomButton
              title="Get started"
              onPress={() => {
                dispatch({type: 'USER_LOGOUT'});
                navigation.navigate(constants.SCREENS.consent);
              }}
            />
          </View>
          <View style={styles.buttons}>
            <CustomButton
              whiteButton="true"
              title="Manage profile"
              onPress={() => {
                dispatch({type: 'USER_LOGOUT'});
                navigation.navigate(constants.SCREENS.login, {
                  nextScreen: constants.SCREENS.manage,
                });
              }}
            />
          </View>

          {/* This is for testing purposes */}
          {/* <View style={styles.buttons}>
            <CustomButton
              whiteButton="true"
              title="Delete all data"
              onPress={clearAllData}
            />
          </View> */}

          <View style={{flex: 1, justifyContent: 'flex-end'}}>
            <View style={{flexDirection: 'row'}}>
              <Caption style={styles.greyText}>
                Details at contoso.com/touchless-access{'\n\n'}
                Contoso Privacy Statement
              </Caption>

              <View style={{flex: 1, alignItems: 'flex-end'}}>
                <CustomButton
                  title="Settings"
                  onPress={() => navigation.navigate('Settings')}
                />
              </View>
            </View>
          </View>
        </View>

        {isPortrait ? <View /> : <View style={styles.rightBox} />}
      </View>
    </View>
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#002C55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    flex: 1,
    flexDirection: 'column',
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: '#002C55',
    justifyContent: 'center',
    resizeMode: 'cover',
    width: '100%',
  },
  backgroundBottom: {
    flex: 1,
  },
  boxContainerP: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  whiteBox: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'white',
    margin: 16,
    padding: 15,
    borderRadius: 4,
  },
  rightBox: {
    flex: 1,
  },
  buttons: {
    paddingBottom: 20,
    color: 'red',
  },
  infoView: {
    marginTop: 15,
    marginBottom: 20,
  },
  textPadding: {
    marginBottom: 10,
  },
  boxContainerL: {
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  greyText: {
    color: '#77787B',
  },
});

export default Welcome;
