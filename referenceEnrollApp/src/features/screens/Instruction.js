import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  BackHandler,
  ScrollView,
  Image,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {Caption, Headline, Subheading1} from '../../styles/fontStyles';
import CustomButton from '../../styles/CustomButton';
import {HeaderBackButton} from '@react-navigation/stack';
import Modal from '../../styles/Modal';
import {deleteEnrollmentAction} from '../userEnrollment/newEnrollmentAction';
import {StackActions} from '@react-navigation/native';
import * as constants from '../../shared/constants';
import {getIsPortrait} from '../portrait/isPortrait';

function Instruction({navigation}) {
  const [showModal, setShowModal] = useState(false);

  getIsPortrait();
  screenWidth = Dimensions.get('window').width;
  var imgHeight = screenWidth <= 600 ? (screenWidth - 24) * (640 / 1040) : 150;
  var flexDir = screenWidth <= 600 ? 'column' : 'row';
  var imgPad = screenWidth <= 600 ? 0 : 12;
  var buttonFlex = screenWidth <= 600 ? 0 : 8;

  const dispatch = useDispatch();
  const dispatchDelete = async () => dispatch(await deleteEnrollmentAction());

  React.useLayoutEffect(() => {
    // Back button shows modal
    navigation.setOptions({
      headerLeft: () => {
        return (
          <HeaderBackButton
            tintColor="white"
            disabled={showModal}
            onPress={() => {
              setShowModal(true);
            }}
          />
        );
      },
    });
  }, [navigation, showModal]);

  let cancel = async () => {
    // Delete all information before going to home page
    await dispatchDelete();
    navigation.dispatch(StackActions.popToTop());
  };

  useEffect(() => {
    // Disables Android hardware back button
    BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', () => true);
      Dimensions.removeEventListener('change', orientationCallback);
    };
  }, []);

  let stay = () => {
    setShowModal(false);
  };

  let modalInfo = {
    title: 'Leave without saving?',
    message: 'You won’t be enrolled, and your information won’t be saved.',
    buttonRight: {title: 'Yes, leave', onPress: cancel},
    buttonLeft: {title: 'No, keep enrolling', onPress: stay},
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {showModal ? (
        <Modal {...modalInfo}></Modal>
      ) : (
        <View style={styles.centerRow}>
          <View>
            <View style={{flexDirection: 'row'}}>
              <View style={{flex: 8, flexDirection: 'column'}}>
                <Caption>Step 2 of 3</Caption>

                <Headline style={styles.headlineMargin}>
                  Tips for creating a face template
                </Headline>

                <Subheading1>
                  We’ll take several photos in a row. These photos will only be
                  used to create your face template. They will not be stored.
                </Subheading1>
              </View>
              <View style={{flex: 0}}></View>
            </View>

            <View style={[styles.picturesRow, {flexDirection: flexDir}]}>
              <View style={[styles.smallColumn, {paddingRight: imgPad}]}>
                <View style={{height: imgHeight}}>
                  <Image
                    style={styles.imgFormat}
                    source={require('../../assets/img_tip_faceVisible.png')}
                  />
                </View>
                <View style={styles.textStyle}>
                  <Subheading1>
                    The camera works best when your face is fully visible and
                    the photos show how you look on a typical day
                  </Subheading1>
                </View>
              </View>
              <View style={[styles.smallColumn, {paddingRight: imgPad}]}>
                <View style={{height: imgHeight}}>
                  <Image
                    style={styles.imgFormat}
                    source={require('../../assets/img_tip_lookAhead.png')}
                  />
                </View>
                <View style={styles.textStyle}>
                  <Subheading1>
                    Look straight ahead and center your face in the frame
                  </Subheading1>
                </View>
              </View>
              <View style={styles.smallColumn}>
                <View style={{height: imgHeight}}>
                  <Image
                    style={styles.imgFormat}
                    source={require('../../assets/img_tip_onlyPerson.png')}
                  />
                </View>
                <View
                  style={[styles.textStyle, {maxHeight: 70, minHeight: 40}]}>
                  <Subheading1>
                    Make sure you’re the only person in view
                  </Subheading1>
                </View>
              </View>
            </View>

            <View style={{flexDirection: 'row', marginTop: 32}}>
              <View style={{flex: 4, marginRight: 12}}>
                <CustomButton
                  title="Create my face template now"
                  style={styles.buttonStyle}
                  onPress={() => {
                    navigation.navigate(constants.SCREENS.imageCapture);
                  }}
                />
              </View>
              <View style={{flex: buttonFlex}}></View>
            </View>

            <Subheading1 style={styles.greyText}>
              Some accessories can obscure parts of your face, such as a cap,
              sunglasses, or a face mask, so you might need to adjust these
              while taking the photos.
            </Subheading1>
          </View>
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
    flex: 12,
    flexDirection: 'row',
    alignSelf: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    maxWidth: 840,
    paddingTop: 80,
  },
  imgFormat: {
    flex: 1,
    width: null,
    height: null,
    borderRadius: 4,
    resizeMode: 'contain',
  },
  smallColumn: {
    flex: 4,
  },
  picturesRow: {
    flexDirection: 'column',
    marginTop: 50,
  },
  headlineMargin: {
    marginTop: 10,
    marginBottom: 10,
  },
  buttonStyle: {
    marginTop: 20,
    minWidth: 255,
  },
  greyText: {
    paddingVertical: 20,
    color: '#6E6E6E',
  },
  textStyle: {
    paddingTop: 8,
    maxHeight: 150,
    minHeight: 100,
  },
});

export default Instruction;
