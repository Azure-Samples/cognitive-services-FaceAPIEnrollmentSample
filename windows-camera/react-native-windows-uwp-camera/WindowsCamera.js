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
    this.inputRef = React.createRef(null);
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

  async TakeColorPictureAsync() {
    var image = await cameraManager.takeColorPictureAsync(this._handle);
    return image;
  }

  async TakeInfraredPictureAsync() {
    var image = await cameraManager.takeInfraredPictureAsync(this._handle);
    return image;
  }

  componentWillUnmount() {
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
  camera: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
});