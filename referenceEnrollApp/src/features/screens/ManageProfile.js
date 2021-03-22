import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler, ScrollView, Image, Dimensions } from 'react-native';
import { useDispatch } from 'react-redux';
import {
  Headline,
  Subheading1,
  Subheading2,
  Body1,
  Body2,
} from '../../styles/fontStyles';
import CustomButton from '../../styles/CustomButton';
import { deleteEnrollmentAction } from '../userEnrollment/newEnrollmentAction';
import { HeaderBackButton } from '@react-navigation/stack';
import * as constants from '../../shared/constants';

import Modal from '../../styles/Modal';
import { newEnrollmentAction } from '../userEnrollment/newEnrollmentAction';
import { StackActions } from '@react-navigation/native';
import { getIsPortrait } from '../portrait/isPortrait';

function ManageProfile({ navigation }) {
  const [modalProps, setModalProps] = useState(null);

  getIsPortrait();
  var screenWidth = Dimensions.get('window').width;

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

  useEffect(() => {
    // Disables Android hardware back button
    BackHandler.addEventListener('hardwareBackPress', () => true);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', () => true);
  }, []);

  const dispatch = useDispatch();
  const dispatchDelete = async () => await dispatch(deleteEnrollmentAction());
  const dispatchNewEnrollment = async () =>
    await dispatch(newEnrollmentAction());

  let deletePrints = async () => {
    // delete prints
    let deleteSucceeded = false;
    let modalInfo = {};

    try {
      deleteSucceeded = await dispatchDelete();
    } catch (error) {
      console.log(error);
      // error occured with deletion
      modalInfo.title = 'Something went wrong.';
      modalInfo.message =
        "We couldn't delete your profile. Please try again later.";
      modalInfo.buttonRight = {
        title: 'Done',
        onPress: () => {
          navigation.dispatch(StackActions.popToTop());
        },
      };
    }

    // show result modal
    if (deleteSucceeded) {
      modalInfo.title = 'Your profile has been deleted';
      modalInfo.message =
        "Thanks for trying touchless access. We'd love to hear how we can do better. Send your thoughts to [globalsecurity@ contoso.com].";
      modalInfo.buttonRight = {
        title: 'End session',
        onPress: () => {
          navigation.dispatch(StackActions.popToTop());
        },
      };
    } else {
      // returns false if person doesn't exist
      modalInfo.title = 'No profile found';
      modalInfo.message =
        'We couldn’t find a profile for you. To create a profile, enroll in touchless access now.';
      modalInfo.buttonRight = {
        title: 'Enroll now',
        onPress: () => {
          navigation.navigate(constants.SCREENS.consent);
        },
      };
      modalInfo.buttonLeft = {
        title: 'Cancel',
        onPress: () => {
          navigation.dispatch(StackActions.popToTop());
        },
      };
    }

    setModalProps(modalInfo);
  };

  let askForDelete = () => {
    let modalInfo = {};
    modalInfo.title = 'Delete profile?';
    modalInfo.message =
      'Your face template will be permanently deleted. \n\n' +
      'You can still use your badge to open doors, and you can re-enroll anytime.';
    modalInfo.buttonRight = {
      title: 'Yes, delete profile',
      onPress: deletePrints,
    };
    modalInfo.buttonLeft = {
      title: 'No, don’t delete',
      onPress: () => {
        setModalProps(null);
      },
    };

    setModalProps(modalInfo);
  };
  let newEnrollmentCreated = false;
  let reEnroll = async () => {
    // create new personId
    // enroll with new personId
    // if succeeded delete old info and replace
    if (!newEnrollmentCreated) {
      newEnrollmentCreated = true;
      await dispatchNewEnrollment();
    }
    navigation.navigate(constants.SCREENS.instruction);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {modalProps ? (
        <Modal {...modalProps}></Modal>
      ) : (
          <View style={styles.centerRow}>
            <View style={styles.column1}>
              <View style={{ marginBottom: 48 }}>
                <View style={styles.headlineMargin}>
                  <Headline>Manage your profile</Headline>
                </View>
              </View>

              <View style={styles.picturesRow}>
                <View style={styles.column1}>
                  <View
                    style={styles.borderLine}>
                    <Body2 style={styles.blueheading}>
                      Summary of data being stored
                  </Body2>
                  </View>
                  <View style={styles.borderLine}>
                    <View
                      style={styles.rowNoFlex}>
                      <View
                        style={[
                          { flex: 8, justifyContent: 'center' },
                        ]}>
                        <View style={styles.headerStyle}>
                          <Subheading2>Your face template</Subheading2>
                        </View>

                        <Body1 style={styles.greyText}>Used to unlock touchless access doors</Body1>
                      </View>
                      <View style={{ flex: 4 }}>
                        <Image
                          style={styles.imgFormat}
                          source={require('../../assets/img_faceTemp_s.png')}
                        />
                      </View>
                    </View>
                    <View style={styles.rowNoFlex}>
                      <Image
                        style={styles.iconFormat}
                        source={require('../../assets/icon_key.png')}
                      />
                      <View style={styles.column1}>
                        <View style={styles.headerStyle} >
                          <Body2 >Who has access</Body2>
                        </View>
                        <Body1 style={styles.greyText}>No one</Body1>
                      </View>
                    </View>
                    <View style={styles.rowNoFlex}>
                      <Image
                        style={styles.iconFormat}
                        source={require('../../assets/icon_timer.png')}
                      />
                      <View style={styles.column1}>
                        <View style={styles.headerStyle} >
                          <Body2>How long it’s stored</Body2>
                        </View>
                        <Body1 style={styles.greyText}>
                          For the duration of your employment or until you delete
                          your data
                      </Body1>
                      </View>
                    </View>
                  </View>
                  <View>
                    <View style={[styles.smallRow]}>
                      <View style={[styles.column1, { minWidth: 300 }]}>
                        <View style={{ paddingBottom: 24 }}>
                          <Body2 style={styles.blueheading}>
                            Make Changes
                        </Body2>
                        </View>
                        <Subheading1>
                          Update your face template to improve recognition at the
                          door.
                      </Subheading1>
                        <View style={styles.buttonContainer}>
                          <CustomButton
                            title="Update face template"
                            whiteButton="true"
                            style={styles.buttonStyle}
                            onPress={reEnroll}
                          />
                        </View>
                        <Subheading1>
                          End your enrollment and delete your face template. You
                          can still use your badge for entry.
                      </Subheading1>
                        <View style={styles.buttonContainer}>
                          <CustomButton
                            title="Delete profile"
                            whiteButton="true"
                            style={styles.buttonStyle}
                            onPress={askForDelete}
                          />
                        </View>
                      </View>
                      <View style={{ flex: 4, }}></View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={screenWidth >= 600 ? { flex: 5 } : {}}></View>
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'white',
    flexDirection: 'column',
  },
  centerRow: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 32,
    maxWidth: 840,
  },
  borderLine: {
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
    borderColor: '#E1E1E1',
  },
  iconFormat: {
    resizeMode: 'contain',
    height: 25,
    width: 25,
    marginRight: 15,
  },
  smallRow: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  rowNoFlex: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  column1: {
    flex: 7,
    flexDirection: 'column',
  },
  imgFormat: {
    flex: 1,
    width: null,
    height: null,
    borderRadius: 4,
    minHeight: 75,
    resizeMode: 'contain',
  },
  picturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  headlineMargin: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonStyle: {
  },
  greyText: {
    color: "#6E6E6E",
  },
  headerStyle: {
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 12,
    marginBottom: 32,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  blueheading: {
    color: '#0078D4',
  },
});

export default ManageProfile;
