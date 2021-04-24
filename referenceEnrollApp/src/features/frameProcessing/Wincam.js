import React, {Component} from 'react';
import {
  requireNativeComponent,
  StyleSheet,
  NativeModules,
  findNodeHandle,
} from 'react-native';

export var Camera = requireNativeComponent('WindowsCameraView');
const cameraManager = NativeModules.WindowsCameraModule;

class WindowsCamera extends Component {
  constructor(props) {
    super(props);
    console.log(this.props);
    this.inputRef = React.createRef();
  }

  _ref;
  _handle;

  _setReference = (ref) => {
    if (ref) {
      this._ref = ref;
      this._handle = findNodeHandle(ref);
    } else {
      this._ref = null;
      this._handle = null;
    }
  };

  async TakePictureAsync() {
    var image = await cameraManager.takePictureAsync(this._handle);
    return image;
  }

  componentWillUnmount() {
    console.log('runs');
    cameraManager.turnCameraOff(this._handle);
  }

  _onCameraInitialized = () => {
    if (this.props.onCameraInitialized) {
      this.props.onCameraInitialized();
    }
  };

  render() {
    return (
      <Camera
        ref={this._setReference}
        onCameraInitialized={this._onCameraInitialized}
        style={styles.camera}></Camera>
    );
  }
}

export default WindowsCamera;

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
