import React, {useState, useEffect} from 'react';
import {View, StyleSheet, BackHandler} from 'react-native';
import Camera from '../frameProcessing/Camera';
import {useSelector, useDispatch} from 'react-redux';
import {ENROLL_RESULT} from '../../shared/constants';
import Modal from '../../styles/Modal';
import {deleteOldEnrollmentAction} from '../userEnrollment/newEnrollmentAction';
import {StackActions} from '@react-navigation/native';
import * as constants from '../../shared/constants';

function ImageCapture({navigation}) {
  useEffect(() => {
    // Disables andorid hardware back button
    BackHandler.addEventListener('hardwareBackPress', () => true);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', () => true);
  }, []);

  const newEnrollInfo = useSelector((state) => state.newEnrollment);
  const [modalProps, setModalProps] = useState(null);

  const dispatch = useDispatch();

  const onEnrollComplete = (enrollResult) => {
    let modalInfo = {};
    switch (enrollResult) {
      case ENROLL_RESULT.successNoTrain:
      case ENROLL_RESULT.success:
        modalInfo.title = 'Success!';
        modalInfo.message = 'Your face template has been created.';
        modalInfo.buttonRight = {
          title: 'Next',
          onPress: () => {
            navigation.navigate(constants.SCREENS.receipt);
          },
        };
        break;
      case ENROLL_RESULT.cancel:
        modalInfo.title = 'Got it';
        modalInfo.message =
          'You won’t be enrolled, and your information won’t be saved.';
        modalInfo.buttonRight = {
          title: 'Done',
          onPress: () => {
            navigation.dispatch(StackActions.popToTop());
          },
        };
        break;
      case ENROLL_RESULT.error:
      case ENROLL_RESULT.timeout:
      default:
        modalInfo.title = 'Something went wrong.';
        modalInfo.message =
          'Sorry, we couldn’t get a photo that the system can use. You can try again later. If you try later, you’ll start enrollment from the beginning. For troubleshooting help, talk to security personnel in the lobby or email [globalsecurity@ contoso.com]. ';
        modalInfo.buttonLeft = {
          title: 'Try again later',
          onPress: () => {
            navigation.dispatch(StackActions.popToTop());
          },
        };
    }

    setModalProps(modalInfo);
  };

  return (
    <View style={styles.root}>
      {modalProps ? (
        <Modal {...modalProps}></Modal>
      ) : (
        <View style={[styles.camStyle]}>
          <Camera onCompleted={onEnrollComplete} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    flex: 1,
    flexDirection: 'column',
  },
  camStyle: {
    flex: 1,
  },
});

export default ImageCapture;
