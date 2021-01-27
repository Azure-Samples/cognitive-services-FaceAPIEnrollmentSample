import React from 'react';

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Subheading2 } from './fontStyles';

export default function CustomButton(props) {
  return (
    <TouchableOpacity onPress={props.onPress}>
      <View
        style={
          props.whiteButton
            ? [styles.whiteButton, props.style]
            : [styles.defaultButton, props.style]
        }>
        <Subheading2>
          <Text
            style={
              props.whiteButton
                ? [styles.blueText, props.style]
                : [styles.defaultText, props.style]
            }>
            {props.title}
          </Text>
        </Subheading2>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  defaultButton: {
    backgroundColor: '#0078D4',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  whiteButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0078D4',
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  defaultText: {
    color: 'white',
  },
  blueText: {
    color: '#0078D4',
  },
});
