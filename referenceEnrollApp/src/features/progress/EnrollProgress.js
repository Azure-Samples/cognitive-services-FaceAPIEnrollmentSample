import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Svg, Defs, Rect, Mask, Circle} from 'react-native-svg';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import EnrollFeedback from '../feedback/EnrollFeedback';
import {CONFIG} from '../../env/env.json';

function EnrollProgress(props) {
  const checkIsPortrait = () => {
    const dim = Dimensions.get('window');
    return dim.height >= dim.width;
  };

  const [isPortrait, setIsPortrait] = useState(checkIsPortrait());

  useEffect(() => {
    const orientationCallback = () => {
      setIsPortrait(checkIsPortrait());
    };
    Dimensions.addEventListener('change', orientationCallback);

    return () => {
      Dimensions.removeEventListener('change', orientationCallback);
    };
  }, []);

  /*
    Get window dimensions to determine 
    circle placement and size
    */
  let dim = Dimensions.get('window');
  let width = dim.width;
  let height = dim.height;

  // Radius changes based on orientation
  let radius = isPortrait ? width / 2.5 : height / 3;
  let x = width / 2;
  let y = height / 2;

  // 5 seconds to update the progress
  let progressDuration = 3000;

  /*
    Progress is # of frames enrolled + 
    the verification check (1), +
    1 for initial progress 
    converted to a percentage
  */
  let rgbProgress =
    (props.rgbProgressCount /
      (CONFIG.ENROLL_SETTINGS.RGB_FRAMES_TOENROLL + 2)) *
    100;

  if (rgbProgress == 100) {
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
              <Circle r={radius} cx={x} cy={y} fill="black" />
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

      <View style={([styles.root], {top: y - radius - 2, left: x - radius})}>
        <AnimatedCircularProgress
          size={radius * 2 + 5}
          duration={progressDuration}
          width={10}
          fill={rgbProgress}
          rotation={0}
          tintColor="#65c368"
          backgroundColor="white"
        />
      </View>

      <View
        style={
          isPortrait
            ? [styles.feedback, {top: 100}]
            : [styles.feedback, {top: 5}]
        }>
        <EnrollFeedback />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    position: 'absolute',
  },
  feedback: {
    flex: 1,
    position: 'absolute',
    flexDirection: 'column',
    alignItems: 'center',
    right: 0,
    left: 0,
  },
});

export default EnrollProgress;
