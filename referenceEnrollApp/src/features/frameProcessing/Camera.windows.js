import React, {useState} from 'react';
import {View, StyleSheet, NativeModules} from 'react-native';
import {RNCamera} from 'react-native-camera';
import Enrollment from './Enrollment';
import {Cam} from '../../shared/constants';

// Camera component for Android
export default function Camera(props) {
  const [startEnroll, setStartEnroll] = useState(false);
  const [frame, setFrame] = useState(0);
  //let cameraRef = React.useRef(null);

  console.log(NativeModules.WindowsCameraViewManager);

  const onCameraReady = () => {
    /*
      when camera signals ready,
      update state to begin enrollment
      in child component
    */
    console.log('camera ready');
    setStartEnroll(true);
  };

  function setFrames(data) {
    if (startEnroll == false) {
      setStartEnroll(true);
    }
    setFrame(data.nativeEvent);
    console.log('fire');
  }

  async function takeBase64Picture() {
    // console.log('called');
    // NativeModules.fancymath.add(2, 2, function (ans) {
    //   console.log('ans', ans);
    // });
    // NativeModules.WindowsCameraViewManager.takepic(function (pic) {
    //   console.log('pic', pic);
    // });
    console.log('taking pic');
    return frame;
  }

  return (
    <View style={styles.root}>
      <Cam
        type="1"
        onFrameArrivedEvent={(evt) => {
          setFrames(evt);
        }}
        style={styles.camera}></Cam>
      {/* <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.front}
        flashMode={RNCamera.Constants.FlashMode.off}
        onCameraReady={onCameraReady}
        captureAudio={false} // Required for iOS
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
      /> */}
      <Enrollment
        onCompleted={props.onCompleted}
        takePicture={takeBase64Picture}
        beginEnrollment={startEnroll}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
});
