import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  NativeModules,
  UIManager,
  findNodeHandle,
} from 'react-native';
import Enrollment from './Enrollment';
import WindowsCamera from './Wincam';

export default function Camera(props) {
  const [startEnroll, setStartEnroll] = useState(true);
  let cameraRef = React.useRef(null);

  async function takeBase64Picture() {
    var frame = await cameraRef.current.TakePictureAsync();
    return {base64: frame};
  }

  return (
    <View style={styles.root}>
      <WindowsCamera ref={cameraRef}></WindowsCamera>
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
