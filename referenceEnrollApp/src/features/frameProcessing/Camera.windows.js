import React, {useState} from 'react';
import {View, StyleSheet, NativeModules} from 'react-native';
import {RNCamera} from 'react-native-camera';
import Enrollment from './Enrollment';
import {Cam} from '../../shared/constants';

// Camera component for Android
export default function Camera(props) {
  const [startEnroll, setStartEnroll] = useState(false);
  //let cameraRef = React.useRef(null);
  var rgb = 0;

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
    console.log('fire ', data.nativeEvent);
    if (data.nativeEvent == 'Color') {
      console.log('setting to 5');
      rgb = 5;
    }
  }

  async function takeBase64Picture() {
    return rgb;
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
