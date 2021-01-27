import React, { useEffect, useState } from 'react';

import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
  ImageBackground,
} from 'react-native';
import { Caption, Headline, Subheading1 } from '../../styles/fontStyles';
import CustomButton from '../../styles/CustomButton';
import { CONFIG } from '../../env/env.json';
import { useDispatch } from 'react-redux';
import * as constants from '../../shared/constants';
import { deletePersonGroup, validatePersonGroup } from '../../shared/helper';
var RNFS = require('react-native-fs');

function Welcome({ navigation }) {
  let dispatch = useDispatch();

  let whiteBoxHeight = "60%";

  const checkIsPortrait = () => {
    const dim = Dimensions.get('window');
    if (dim.width <= 600) {
      whiteBoxHeight = "60%"
    }
    else if (dim.width > 600 && dim.width < 840) {
      whiteBoxHeight = "40%"
    }
    else {
      whiteBoxHeight = "100%"
    }
    return dim.height >= dim.width;
  };

  const [isPortrait, setIsPortrait] = useState(checkIsPortrait());


  const showAlert = () => {
    // For development and testing environment, expose settings page
    let buttonOption =
      CONFIG.ENVIRONMENT == 'dev'
        ? [
          {
            text: 'Settings',
            onPress: () => navigation.navigate('Settings'),
          },
        ]
        : [
          {
            text: 'Try again',
            onPress: async () => {
              let validated = await validatePersonGroup(
                CONFIG.PERSONGROUP_RGB,
              );

              if (validated == false) {
                showAlert();
              }
            },
          },
        ];
    Alert.alert(
      'A problem occurred',
      'Cannot connect to service',
      buttonOption,
      {
        cancelable: false,
      },
    );
  };

  useEffect(() => {
    const orientationCallback = () => {
      setIsPortrait(checkIsPortrait());
    };
    Dimensions.addEventListener('change', orientationCallback);

    validatePersonGroup(CONFIG.PERSONGROUP_RGB).then((personGroupValidated) => {
      if (personGroupValidated == false) {
        showAlert();
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
        console.log('files', result);

        // stat the first file
        return result;
      })
      .then((result) => {
        for (let item of result) {
          if (item.isFile()) {
            console.log('deleting', item.path);
            RNFS.unlink(item.path);
          }
        }
      })
      .catch((err) => {
        console.log(err.message, err.code);
      });

    deletePersonGroup(CONFIG.PERSONGROUP_RGB).then((res) => {
      console.log('Delete result:', res);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundColumn}>

        <View style={styles.backroundTopRow}>
          <View style={styles.imgContainer}>
            <Image
              source={require('../../assets/bg_heroIllustration_welcome.png')}
              style={styles.backgroundImage}
            />
          </View>
        </View>

        {isPortrait ? <View style={styles.backgroundBottomRow} /> : <View />}


        <View style={isPortrait ? styles.boxContainerP : styles.boxContainerL}>
          <View
            style={[styles.whiteBox, { height: whiteBoxHeight }]}>


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
                  dispatch({ type: 'USER_LOGOUT' });
                  navigation.navigate(constants.SCREENS.consent);
                }}
              />
            </View>
            <View style={styles.buttons}>
              <CustomButton
                whiteButton="true"
                title="Manage profile"
                onPress={() => {
                  dispatch({ type: 'USER_LOGOUT' });
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

            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Caption style={styles.greyText}>
                Details at contoso.com/touchless-access{'\n'}
                  Contoso Privacy Statement
                </Caption>
            </View>

            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Caption style={styles.greyText}>
                Contoso | Real Estate & Security
                </Caption>
            </View>



          </View>

          {isPortrait ? <View /> : <View style={styles.rightBox} />}
        </View>


      </View>


    </View >
  );
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#002C55'
  },
  backgroundColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  backroundTopRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: "flex-end",
  },
  imgContainer: {
    marginTop: -30,
    height: 375, // Image has a 1.6 aspect ratio
    width: 600,  // 375 X 600 = 1.6 AR
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    resizeMode: "contain",
  },
  backgroundBottomRow: {
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
    padding: 24,
    borderRadius: 4,
  },
  rightBox: {
    flex: 1,
  },
  buttons: {
    paddingBottom: 20,
  },
  infoView: {
    marginTop: 15,
    marginBottom: 30,
  },
  textPadding: {
    marginBottom: 16,
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
