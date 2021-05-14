import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import ProgressBar from 'react-native-progress/Bar';
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

  let progressValue =
    (props.progressCount /
      props.total);

  return (
    <View>
      <View style={([styles.root], {top: y - radius - 50})}>
        <View style={styles.feedback}>
          <EnrollFeedback />
        </View>
          <View style={{justifyContent:'center', alignItems:'center'}}>
            <ProgressBar
              progress={progressValue}
              height={15}
              unfilledColor={"white"}
              color={'#92C353'}
              width={330}
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
