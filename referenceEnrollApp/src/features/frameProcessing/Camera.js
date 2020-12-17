import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {RNCamera} from 'react-native-camera';
import Enrollment from './Enrollment';

// Camera component for Android
export default function Camera(props) {
  const [startEnroll, setStartEnroll] = useState(false);
  let cameraRef = React.useRef(null);

  const onCameraReady = () => {
    /*
        when camera signals ready,
        update state to begin enrollment
        in child component
        */
    console.log('camera ready');
    setStartEnroll(true);
  };

  async function takeBase64Picture() {
    let frameData;

    try {
      frameData = await cameraRef.current.takePictureAsync({base64: true});
    } catch (error) {
      console.log('Error taking picture:', error);
    }

    return frameData;
  }

  return (
    <View style={styles.root}>
      <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.front}
        flashMode={RNCamera.Constants.FlashMode.on}
        onCameraReady={onCameraReady}
        captureAudio={false} // Required for iOS
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
      />
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
