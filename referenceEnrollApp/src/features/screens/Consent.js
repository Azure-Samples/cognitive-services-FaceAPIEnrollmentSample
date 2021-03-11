import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  BackHandler,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Headline,
  Subheading1,
  Subheading2,
  Title1,
} from '../../styles/fontStyles';
import CustomButton from '../../styles/CustomButton';
import Modal from '../../styles/Modal';
import { HeaderBackButton } from '@react-navigation/stack';
import { StackActions } from '@react-navigation/native';
import * as constants from '../../shared/constants';

function Consent({ navigation }) {
  const getWidth = () => {
    return Dimensions.get('window').width;
  };

  const [screenWidth, setScreenWidth] = useState(getWidth());
  const [showModal, setShowModal] = useState(false);

  const showDeclineModal = () => {
    setShowModal(true);
  };

  useEffect(() => {
    // Disables Android hardware back button
    BackHandler.addEventListener('hardwareBackPress', () => true);

    const orientationCallback = () => {
      setScreenWidth(getWidth());
    };
    Dimensions.addEventListener('change', orientationCallback);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', () => true);
      Dimensions.removeEventListener('change', orientationCallback);
    };
  }, []);

  // Forces backbutton in header to go to welcome page
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => {
        return (
          <HeaderBackButton
            tintColor="white"
            disabled={showModal}
            onPress={() => {
              navigation.dispatch(StackActions.popToTop());
            }}
          />
        );
      },
    });
  }, [navigation, showModal]);

  const declineModalText =
    'You won’t be enrolled in touchless access. If you change your mind, you can come back to this screen anytime.';
  let backToHome = () => {
    navigation.dispatch(StackActions.popToTop());
  };
  let buttonRight = { title: 'Close', onPress: backToHome };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {showModal ? (
        <Modal
          title="Got it"
          message={declineModalText}
          buttonRight={buttonRight}></Modal>
      ) : (
          <View style={styles.centerColumn}>
            <View style={styles.topSection}>
              <View style={styles.imageBox}>
                <Image
                  style={styles.imageFormat}
                  source={require('../../assets/bg_heroIllustration_request.png')}
                />
              </View>

              {(screenWidth >= 640) ?
                (<View style={styles.textBox}>
                  <View style={{ flex: 0.5, alignContent: "center", justifyContent: "center", flexDirection: 'column', padding: 30 }}>
                    <Headline style={{ marginBottom: 10 }}>
                      Enroll in touchless access today
                  </Headline>

                    <Subheading2 style={styles.greyText}>
                      Touchless access uses face recognition to let you
                      conveniently unlock building doors using a face template.
                  </Subheading2>
                  </View>
                </View>
                ) : (<View />)}

            </View>

            <View style={styles.bottomSection}>
              {screenWidth < 500 ? (
                <Subheading2 style={styles.greyText}>
                  Touchless access uses face recognition to let you conveniently
                  unlock building doors using a face template.
                </Subheading2>
              ) : (
                  <View />
                )}

              <View style={styles.row1}>
                <View
                  style={
                    screenWidth >= 550
                      ? [styles.centerMain, { flex: 1 }]
                      : styles.centerMain
                  }>
                  <Title1>What is a face template?</Title1>
                  <Subheading1>
                    A face template is a unique set of numbers that represent the
                    distinctive features of your face.
                </Subheading1>
                </View>

                <View style={[styles.column1, { minHeight: 150 }]}>
                  <Image
                    style={styles.imageFormat2}
                    source={require('../../assets/img_faceTemp_l.png')}
                  />
                </View>
              </View>
              <View style={styles.row1}>
                <View style={styles.column1}>
                  <View style={styles.row1}>
                    <Title1>What information gets stored?</Title1>
                    <Subheading1>
                      Only your face template gets stored. No one has access to
                      your face template.
                  </Subheading1>
                  </View>
                  <View style={styles.rowNoWrap}>
                    <Image
                      style={styles.iconFormat}
                      source={require('../../assets/icon_camera.png')}
                    />
                    <View style={{ flex: 1, marginBottom: 20 }}>
                      <Subheading1>
                        If you choose to enroll, you’ll take a few photos of your
                        face today to create one.
                    </Subheading1>
                    </View>
                  </View>
                  <View style={styles.rowNoWrap}>
                    <Image
                      style={styles.iconFormat}
                      source={require('../../assets/icon_lock.png')}
                    />
                    <View style={{ flex: 1 }}>
                      <Subheading1>
                        Using face templates helps ensure that you always have
                        building access, and it’s more secure than a badge.
                    </Subheading1>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.row1}>
                <View style={styles.column1}>
                  <Title1>We protect your privacy at every step</Title1>

                  <View style={styles.row1}>
                    <View style={{ ...styles.column1, ...styles.smallColumn }}>
                      <View style={styles.rowNoWrap}>
                        <Image
                          style={styles.iconFormat}
                          source={require('../../assets/img_shield.png')}
                        />
                        <View style={styles.wrap}>
                          <Subheading2>
                            Face templates are only used for building entry
                        </Subheading2>
                          <Subheading1 style={styles.subheadingMargin}>
                            Your face template isn’t shared or used for any
                            purpose besides building access.
                        </Subheading1>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.column1, styles.smallColumn]}>
                      <View style={styles.rowNoWrap}>
                        <Image
                          style={styles.iconFormat}
                          source={require('../../assets/img_lock.png')}
                        />
                        <View style={styles.wrap}>
                          <Subheading2>
                            Face templates are securely encrypted
                        </Subheading2>
                          <Subheading1 style={styles.subheadingMargin}>
                            Your face template is encrypted following cloud
                            security standards ISO 27018 and SOC 1, 2, 3.
                        </Subheading1>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.column1, styles.smallColumn]}>
                      <View style={styles.rowNoWrap}>
                        <Image
                          style={styles.iconFormat}
                          source={require('../../assets/img_clock.png')}
                        />
                        <View style={styles.wrap}>
                          <Subheading2>
                            Face templates are stored only during employment
                        </Subheading2>
                          <Subheading1 style={styles.subheadingMargin}>
                            Your face template will be automatically deleted if
                            you leave Contoso.
                        </Subheading1>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.column1, styles.smallColumn]}>
                      <View style={styles.rowNoWrap}>
                        <Image
                          style={styles.iconFormat}
                          source={require('../../assets/img_bin.png')}
                        />
                        <View style={styles.wrap}>
                          <Subheading2>Delete your data anytime</Subheading2>
                          <Subheading1 style={styles.subheadingMargin}>
                            You can change your mind anytime and delete your face
                            template.
                        </Subheading1>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.bottomSection}>
              <View style={styles.row1}>
                <View style={styles.column1} style={{ flex: 2 }}>
                  <Title1 style={styles.textPadding}>
                    Ready to try touchless access?
                </Title1>

                  <Subheading1 style={styles.greyText}>
                    Participation is optional. If you don’t want to enroll, you
                    can continue to scan your badge for entry.
                </Subheading1>
                </View>
                <View style={screenWidth > 500 ? styles.column1 : ''} />
              </View>

              <View style={styles.row1}>
                <CustomButton
                  title="Yes, create my face template"
                  style={styles.buttonMargin}
                  onPress={() => {
                    navigation.navigate(constants.SCREENS.login, {
                      nextScreen: constants.SCREENS.instruction,
                    });
                  }}
                />
                <CustomButton
                  title="No, don’t create my face template"
                  style={styles.buttonMargin}
                  onPress={showDeclineModal}
                />
              </View>
            </View>
          </View >
        )
      }
    </ScrollView >
  );
}

var styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
  },
  centerColumn: {
    maxWidth: 840,
    flex: 1,
    flexDirection: 'column',
    marginTop: 0,
  },
  topSection: {
    flex: 1,
    flexDirection: 'row',
    maxHeight: 400,
    marginBottom: -70
  },
  bottomSection: {
    flex: 2,
    backgroundColor: 'white',
    flexDirection: 'column',
    marginBottom: 16,
    borderRadius: 4,
    padding: 30,
    paddingTop: 20,
    marginLeft: 30,
    marginRight: 30,
  },
  textBox: {
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
  },
  rowNoWrap: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  wrap: {
    flex: 1,
    flexDirection: 'column',
  },
  imageBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  imageFormat: {
    width: "90%",
    flexDirection: 'row',
    resizeMode: 'contain',
  },
  imageFormat2: {
    resizeMode: 'contain',
    width: '100%',
    height: '100%',
  },
  iconFormat: {
    resizeMode: 'contain',
    height: 18.5,
    width: 20,
    marginRight: 15,
  },
  row1: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    marginTop: 10,
  },
  centerMain: {
    justifyContent: 'center',
  },
  column1: {
    flex: 1,
    flexDirection: 'column',
    margin: 10,
  },
  smallColumn: {
    maxWidth: 300,
    minWidth: 300,
  },
  boxContainerP: {
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  textPadding: {
    marginBottom: 10,
    marginTop: 30,
  },
  subheadingMargin: {
    color: '#6E6E6E',
  },
  buttonMargin: {
    margin: 20,
    width: 300,
  },
  greyText: {
    color: '#212121',
  },
});

export default Consent;
