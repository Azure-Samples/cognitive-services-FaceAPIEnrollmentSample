import React from 'react';
import {View, StyleSheet, Dimensions, Easing, Platform} from 'react-native';
import {Svg, Defs, Rect, Mask, Circle} from 'react-native-svg';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import EnrollFeedback from '../feedback/EnrollFeedback';
import {CONFIG} from '../../env/env.json';
import useIsPortrait from '../portrait/isPortrait';

function EnrollProgress(props) {
  var isPortrait = useIsPortrait();
  /*
    Get window dimensions to determine 
    circle placement and size
  */
  let dim = Dimensions.get('window');
  let width = dim.width;
  let height = dim.height;
  let radius;

  if (isPortrait && width >= 640) {
    radius = width / 2.5;
  } else if (isPortrait) {
    radius = width / 2.1;
  } else {
    radius = height / 3;
  }

  let x = width / 2;
  let y = height / 2;

  // 5 seconds to update the progress
  let progressDuration = 3000;

  let progressValue =
    (props.progressCount /
      props.total) * 100;

  if (progressValue == 100) {
    /*
        On the last update, speed up the duration
        so that it completes before page changes
        */
    progressDuration = 500;
  }

  return (
    <View>
      <View style={{position: 'absolute'}}>
        <Svg height={height} width={width}>
          <Defs>
            <Mask id="mask" x="0" y="0" height="100%" width="100%">
              <Rect height="100%" width="100%" fill="#fff" />
              <Circle r={radius} cx={x} cy={y + 60} fill="black" />
            </Mask>
          </Defs>
          <Rect
            height="100%"
            width="100%"
            fill="rgba(0, 0, 0, 0.5)"
            mask="url(#mask)"
            fill-opacity="0"
          />
        </Svg>
      </View>
      <View style={([styles.root], {top: y - radius - 50})}>
        <View style={styles.feedback}>
          <EnrollFeedback />
        </View>
        <View style={{left: x - radius}}>
          <AnimatedCircularProgress
            size={radius * 2}
            duration={progressDuration}
            width={10}
            fill={progressValue}
            rotation={0}
            tintColor="#92C353"
            backgroundColor="white"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
  },
  feedback: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    height: 100,
    right: 0,
    left: 0,
  },
});

export default EnrollProgress;
