import React, {useState} from 'react';
import {View, StyleSheet, NativeModules} from 'react-native';
import {RNCamera} from 'react-native-camera';
import Enrollment from './Enrollment';
import {Cam} from '../../shared/constants';

export default function Camera(props) {
  const [startEnroll, setStartEnroll] = useState(false);
  const [frame, setFrame] = useState('');

  function setFrames(data) {
    if (startEnroll == false) {
      setStartEnroll(true);
    }
    setFrame(data.nativeEvent);
  }

  async function takeBase64Picture() {
    return {base64: frame};
  }

  return (
    <View style={styles.root}>
      <Cam
        type="1"
        onFrameArrivedEvent={(evt) => {
          setFrames(evt);
        }}
        style={styles.camera}></Cam>
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
