var ReactNative = require('react-native');
var React = require('react');

export default function VideoWeb(props) {
  var mirror = props.mirror;
  var objectFit = props.objectFit;
  let stream = props.stream;

  const videoRef = React.useRef();

  if (stream && videoRef.current && !videoRef.current.srcobject) {
    videoRef.current.srcObject = stream;
  }

  var videoStyle = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 400,
    height: 400,
    objectPosition: 'center center',
    objectFit: objectFit || 'contain',
  };

  if (mirror) {
    videoStyle.transform = 'rotateY(180deg)';
    videoStyle.WebkitTransform = 'rotateY(180deg)';
    videoStyle.MozTransform = 'rotateY(180deg)';
  }

  return React.createElement(
    ReactNative.View,
    props,
    React.createElement('video', {
      style: videoStyle,
      id: 'videoId',
      autoplay: '',
      ref: videoRef,
    }),
  );
}
