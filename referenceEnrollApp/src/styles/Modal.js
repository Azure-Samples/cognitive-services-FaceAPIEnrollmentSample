import React from 'react';

import { View, StyleSheet } from 'react-native';
import CustomButton from './CustomButton';
import { Subheading1, Title1 } from './fontStyles';

export default function Modal(props) {
  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <Title1 style={styles.blueText}>{props.title}</Title1>
        <Subheading1>{props.message}</Subheading1>
        <View style={styles.buttons}>
          {props.buttonLeft ? (
            <CustomButton
              title={props.buttonLeft.title}
              onPress={props.buttonLeft.onPress}
              whiteButton="true"
              style={styles.buttonStyle}
            />
          ) : (
              <View />
            )}

          {props.buttonRight ? (
            <CustomButton
              title={props.buttonRight.title}
              onPress={props.buttonRight.onPress}
              whiteButton="true"
              style={styles.buttonStyle}
            />
          ) : (
              <View />
            )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    bottom: 0,
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 10,
    borderRadius: 4,
    padding: 5,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  buttonStyle: {
    margin: 5,
    borderWidth: 0,
  },
  blueText: {
    color: '#0078D4',
    marginBottom: 5,
  },
});
