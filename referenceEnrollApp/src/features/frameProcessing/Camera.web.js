import React, {useEffect, useState, useCallback} from 'react';
import {View, StyleSheet, Text, Alert} from 'react-native';
import VideoWeb from './VideoWeb';

// Camera component for web
// not yet implemented
export default function Camera() {
  const [mediaStream, setMediaStream] = useState(null);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((sourceInfos) => {
      let videoSourceId;
      let videoSource;
      console.log('si', sourceInfos);
      for (let i = 0; i < sourceInfos.length; i++) {
        const sourceInfo = sourceInfos[i];

        // takes first video source in array
        if (sourceInfo.kind == 'videoinput' && !videoSource) {
          videoSourceId = sourceInfo.deviceId;
          videoSource = sourceInfo.label;
          console.log('source:', videoSource);
        }
      }

      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {deviceId: videoSourceId ? {exact: videoSourceId} : undefined},
        })
        .then((stream) => {
          console.log('Got stream', stream);
          setMediaStream(stream);
        })
        .catch((error) => {
          console.log('error', error);
        });
    });
  }, []);

  if (mediaStream) {
    const imageCapture = new ImageCapture(mediaStream.getVideoTracks()[0]);
    imageCapture.takePhoto().then((blob) => {
      console.log('Blob', blob);
    });
    /*
    Enrollment support for web not yet implemented
    */
  }

  return (
    <View style={styles.root}>
      <View style={styles.videoContainer}>
        <View style={[styles.videos, styles.localVideos]}>
          <VideoWeb stream={mediaStream} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    flex: 1,
    padding: 20,
  },
  videoContainer: {
    flex: 1,
    minHeight: 800,
  },
  videos: {
    width: '100%',
    flex: 1,
    position: 'relative',
    overflow: 'hidden',

    borderRadius: 6,
  },
  localVideos: {
    height: 300,
    marginBottom: 10,
  },
});
