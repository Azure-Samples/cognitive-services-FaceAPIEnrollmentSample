import React, {useState, useEffect} from 'react';

import {
  View,
  StyleSheet,
  BackHandler,
  TextInput,
  Dimensions,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Caption, Headline, fontStyles, Title1} from '../../styles/fontStyles';
import CustomButton from '../../styles/CustomButton';
import {HeaderBackButton} from '@react-navigation/stack';
import Modal from '../../styles/Modal';
import {
  checkEnrollmentExistsAction,
  checkIfReEnrollment,
  newEnrollmentAction,
  setExistingPersonIds,
} from '../userEnrollment/newEnrollmentAction';
import {StackActions} from '@react-navigation/native';
import * as constants from '../../shared/constants';
import useIsPortrait from '../portrait/isPortrait';
import {saveUserInfoAction} from '../userEnrollment/saveUserInfoAction';
import {beginAsyncEvent} from 'react-native/Libraries/Performance/Systrace';

/*
    IMPORTANT: 
    This login page is for demonstration only. 
    It does not preform any authentication. It is a placeholder to 
    implement the authentication / sign in of your choosing. This app
    uses the username to create a mapping with the personId. 
    For demo purposes only, the mapping is written to a file on the device. 
    For production use, the app should instead read/write this username <--> personId mapping
    to a secured and encrypted database. The user's personId should be considered
    a secret.
*/

function Login({route, navigation}) {
  useEffect(() => {
    // Disables Android hardware back button
    BackHandler.addEventListener('hardwareBackPress', () => true);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', () => true);
  }, []);

  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [modalProps, setModalProps] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  // Causes rerender when orientation changes
  useIsPortrait();
  var screenWidth = Dimensions.get('window').width;
  var screenHeight = Dimensions.get('window').height;
  var paddingTop = screenHeight < 400 ? 30 : 80;

  React.useLayoutEffect(() => {
    // Back button goes to Welcome page
    navigation.setOptions({
      headerLeft: () => {
        return (
          <HeaderBackButton
            tintColor="white"
            disabled={modalProps != null}
            onPress={() => {
              navigation.dispatch(StackActions.popToTop());
            }}
          />
        );
      },
    });
  }, [navigation, modalProps]);

  // Only create a new person in FaceAPI if person is enrolling.
  const enrollmentPath =
    route.params.nextScreen == constants.SCREENS.instruction;

  const dispatch = useDispatch();

  const createNewPersons = async () => {
    console.log('creating...');
    return await dispatch(newEnrollmentAction());
  };

  const checkForExistingEnrollment = async (username) =>
    await dispatch(saveUserInfoAction(username));

  const signIn = async () => {
    setShowLoading(true);
    await handleSignIn();
    setShowLoading(false);
  };

  const checkValidUsername = (username) => {
    var lettersAndNumbers = /^[0-9a-zA-Z]+$/;

    if (!username || username == '' || !username.match(lettersAndNumbers)) {
      console.log('username not allowed');
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    /* 
        There are 4 possible senarios: 
        1. User clicks start and has never enrolled: continue to instructions page
        2. User clicks start, but already has enrolled: take to manage page
        3. User clicks manage, but has never enrolled: take to consent page 
        4. User clicks manage, has already enrolled: continue to manage page
    */

    let defaultModal = {
      title: 'Sign-in failed',
      message: 'Check your username and password and try again.',
      buttonRight: {
        title: 'Try Again',
        onPress: () => {
          setModalProps(null);
        },
      },
      buttonLeft: {
        title: 'Cancel',
        onPress: () => {
          navigation.dispatch(StackActions.popToTop());
        },
      },
    };

    // Clear up any spaces in username
    let username = usernameInput.replace(/\s/g, '').toLowerCase();
    console.log('username: ', username);

    // Validate username
    if (checkValidUsername(username) == false) {
      setModalProps(defaultModal);
      return;
    }

    let enrollmentExists = await checkForExistingEnrollment(username);

    if (enrollmentExists) {
      if (enrollmentPath) {
        console.log('Enrollment path, enrollment exists');
        // Enrollment already exists
        let modalInfo = {
          title: 'You are already enrolled',
          message:
            'We already found an enrollment profile with that username. You can manage your enrollment or go back to home.',
          buttonLeft: {
            title: 'Back to home',
            onPress: () => {
              navigation.dispatch(StackActions.popToTop());
            },
          },
          buttonRight: {
            title: 'Manage my enrollment',
            onPress: () => {
              navigation.navigate(constants.SCREENS.manage);
            },
          },
        };
        setModalProps(modalInfo);
      } else {
        console.log('Manage path, enrollment exists');

        // Take to manage page
        navigation.navigate(route.params.nextScreen);
      }
    } // Enrollment doesn't exists
    else {
      if (enrollmentPath) {
        console.log('Enrollment path, new enrollment');

        // First time enrolling
        // take to instructions
        // create person and save info
        let created = await createNewPersons();
        if (created) {
          navigation.navigate(route.params.nextScreen);
        } else {
          // Error with saving info, prompt login again
          setModalProps(defaultModal);
        }
      } else {
        console.log('manage path, new enrollment');

        // Show no profile exists modal
        // dont save info
        let modalInfo = {
          title: 'No profile found',
          message:
            'We couldn’t find a profile for you. To create a profile, enroll in touchless access now.',
          buttonLeft: {
            title: 'Cancel',
            onPress: () => {
              navigation.dispatch(StackActions.popToTop());
            },
          },
          buttonRight: {
            title: 'Enroll now',
            onPress: () => {
              setModalProps(null);
              navigation.navigate(constants.SCREENS.consent);
            },
          },
        };

        setModalProps(modalInfo);
      }
    }
  };

  return (
    <View style={styles.container}>
      {modalProps ? (
        <Modal {...modalProps}></Modal>
      ) : (
        <View style={[styles.centerRow, {paddingTop: paddingTop}]}>
          <View style={styles.column1}>
            <Caption>Step 1 of 3</Caption>

            <Headline style={styles.headlineMargin}>
              Sign in to your Contoso corporate account
            </Headline>
            <View>
              <TextInput
                style={
                  usernameFocused
                    ? {...styles.textInputFocus, ...fontStyles.subheading1}
                    : {...styles.textInputStyle, ...fontStyles.subheading1}
                }
                onChangeText={(text) => setUsernameInput(text)}
                onFocus={() => {
                  setUsernameFocused(true);
                }}
                onBlur={() => {
                  setUsernameFocused(false);
                }}
                placeholder="Username"
              />
              <TextInput
                style={
                  passwordFocused
                    ? [styles.textInputFocus, fontStyles.subheading1]
                    : [styles.textInputStyle, fontStyles.subheading1]
                }
                placeholder="Password"
                secureTextEntry={true}
                onFocus={() => {
                  setPasswordFocused(true);
                }}
                onBlur={() => {
                  setPasswordFocused(false);
                }}
              />
            </View>
            <View style={styles.buttonStyle}>
              <CustomButton
                title="Sign in"
                style={{width: 100}}
                onPress={signIn}
              />
            </View>
          </View>
          {screenWidth >= 600 ? <View style={styles.column1} /> : <View />}
        </View>
      )}
      {showLoading ? (
        <View style={styles.splashScreen}>
          <Title1 style={{color: 'white'}}>Loading . . .</Title1>
        </View>
      ) : (
        <View />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    flexDirection: 'column',
  },
  centerRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    maxWidth: 840,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: 'white',
  },
  column1: {
    flex: 6,
    flexDirection: 'column',
  },
  textInputStyle: {
    borderColor: '#E1E1E1',
    borderBottomWidth: 2,
    marginTop: 20,
  },
  textInputFocus: {
    borderColor: '#0078D4',
    borderBottomWidth: 2,
    marginTop: 20,
  },
  headlineMargin: {
    marginBottom: 50,
    marginTop: 10,
  },
  buttonStyle: {
    marginTop: 32,
    alignItems: 'flex-start',
  },
  splashScreen: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    opacity: 0.7,
  },
});

export default Login;
