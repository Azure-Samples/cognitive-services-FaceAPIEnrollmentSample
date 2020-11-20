import React from 'react';

import {View, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {Subheading2} from '../../styles/fontStyles';

/*
Component reports quality filtering 
feedback during enrollment process
*/
function EnrollFeedback() {
  const feedback = useSelector((state) => state.feedback.message);

  return (
    <View>
      {feedback != '' ? (
        <View style={styles.root}>
          <Subheading2>{feedback}</Subheading2>
        </View>
      ) : (
        <View />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 4,
    minWidth: 200,
    maxWidth: 350,
  },
});

export default EnrollFeedback;
