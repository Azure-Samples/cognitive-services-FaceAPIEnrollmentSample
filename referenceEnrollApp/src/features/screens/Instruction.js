import React, { useState, useEffect } from 'react';
import { View, StyleSheet, BackHandler, ScrollView, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { Caption, Headline, Subheading1 } from '../../styles/fontStyles';
import CustomButton from '../../styles/CustomButton';
import { HeaderBackButton } from '@react-navigation/stack';
import Modal from '../../styles/Modal';
import { deleteEnrollmentAction } from '../userEnrollment/newEnrollmentAction';
import { StackActions } from '@react-navigation/native';
import * as constants from '../../shared/constants';

function Instruction({ navigation }) {
  const [showModal, setShowModal] = useState(false);

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
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', () => true);
  }, []);

  let stay = () => {
    setShowModal(false);
  };

  let modalInfo = {
    title: 'Leave without saving?',
    message: 'You won’t be enrolled, and your information won’t be saved.',
    buttonRight: { title: 'Yes, leave', onPress: cancel },
    buttonLeft: { title: 'No, keep enrolling', onPress: stay },
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.smallRow} />
      {showModal ? (
        <Modal {...modalInfo}></Modal>
      ) : (
          <View style={styles.centerRow}>
            <View style={styles.column1}>
              <Caption>Step 2 of 3</Caption>

              <Headline style={styles.headlineMargin}>
                Tips for creating a face template
            </Headline>

              <Subheading1>
                We’ll take several photos in a row. These photos will only be used
                to create your face template. They will not be stored.
            </Subheading1>

              <View style={styles.picturesRow}>
                <View style={[styles.column1, styles.smallColumn]}>
                  <View style={{ height: 200 }}>
                    <Image
                      style={styles.imgFormat}
                      source={require('../../assets/img_tip_faceVisible.png')}
                    />
                  </View>
                  <View style={{ height: 100 }}>
                    <Subheading1>
                      The camera works best when your face is fully visible and
                      the photos show how you look on a typical day
                  </Subheading1>
                  </View>
                </View>
                <View style={[styles.column1, styles.smallColumn]}>
                  <View style={{ height: 200 }}>
                    <Image
                      style={styles.imgFormat}
                      source={require('../../assets/img_tip_lookAhead.png')}
                    />
                  </View>
                  <View style={{ height: 100 }}>
                    <Subheading1>
                      Look straight ahead and center your face in the frame
                  </Subheading1>
                  </View>
                </View>
                <View style={[styles.column1, styles.smallColumn]}>
                  <View style={{ height: 200 }}>
                    <Image
                      style={styles.imgFormat}
                      source={require('../../assets/img_tip_onlyPerson.png')}
                    />
                  </View>
                  <View style={{ height: 100 }}>
                    <Subheading1>
                      Make sure you’re the only person in view
                  </Subheading1>
                  </View>
                </View>
              </View>

              <CustomButton
                title="Create my face template now"
                style={styles.buttonStyle}
                onPress={() => {
                  navigation.navigate(constants.SCREENS.imageCapture);
                }}
              />

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
    backgroundColor: '#E5E5E5',
    flexDirection: 'column',
  },
  centerRow: {
    flex: 0,
    flexDirection: 'row',
    alignSelf: 'center',
    paddingLeft: 60,
    paddingRight: 60,
    maxWidth: 840,
  },
  smallRow: {
    height: 50,
  },
  column1: {
    flex: 1,
    flexDirection: 'column',
    paddingRight: 20,
  },
  imgFormat: {
    flex: 1,
    width: null,
    height: null,
    borderRadius: 4,
    resizeMode: 'contain',
  },
  smallColumn: {
    maxWidth: 300,
    minWidth: 300,
  },
  picturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 50,
  },
  headlineMargin: {
    marginTop: 10,
    marginBottom: 10,
  },
  buttonStyle: {
    marginTop: 20,
  },
  greyText: {
    paddingVertical: 20,
    color: '#6E6E6E',
  },
});

export default Instruction;
