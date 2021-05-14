import React from 'react';
import {StyleSheet, Text, Platform} from 'react-native';

let useAndroidFont = Platform.OS == 'android';
console.log('android', useAndroidFont);
function Caption(props) {
  return (
    <Text
      style={[
        fontStyles.caption,
        props.style,
        useAndroidFont ? androidStyle.font : '',
      ]}>
      {props.children}
    </Text>
  );
}

function Body1(props) {
  return (
    <Caption>
      <Text
        style={[
          fontStyles.body1,
          props.style,
          useAndroidFont ? androidStyle.font : '',
        ]}>
        {props.children}
      </Text>
    </Caption>
  );
}

function Body2(props) {
  return (
    <Body1>
      <Text
        style={[
          fontStyles.body2,
          props.style,
          useAndroidFont ? androidStyle.font : '',
        ]}>
        {props.children}
      </Text>
    </Body1>
  );
}

function Subheading1(props) {
  return (
    <Text
      style={[
        fontStyles.subheading1,
        props.style,
        useAndroidFont ? androidStyle.font : '',
      ]}>
      {props.children}
    </Text>
  );
}

function Subheading2(props) {
  return (
    <Subheading1>
      <Text
        style={[
          fontStyles.subheading2,
          props.style,
          useAndroidFont ? androidStyle.font : '',
        ]}>
        {props.children}
      </Text>
    </Subheading1>
  );
}

function Subheading3(props) {
  return (
      <Text
        style={[
          fontStyles.subheading3,
          props.style,
          useAndroidFont ? androidStyle.font : '',
        ]}>
        {props.children}
      </Text>
  );
}

function Title1(props) {
  return (
    <Text
      style={[
        fontStyles.title1,
        props.style,
        useAndroidFont ? androidStyle.font : '',
      ]}>
      {props.children}
    </Text>
  );
}

function Headline(props) {
  return (
    <Text
      style={[
        fontStyles.headline,
        props.style,
        useAndroidFont ? androidStyle.font : '',
      ]}>
      {props.children}
    </Text>
  );
}

const fontStyles = StyleSheet.create({
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Arial',
    fontWeight: '400',
    fontStyle: 'normal',
  },
  body1: {
    fontSize: 14,
  },

  body2: {
    fontWeight: 'bold',
  },
  subheading1: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
  },
  subheading2: {
    fontWeight: '500',
  },
  subheading3: {
    fontSize: 16,
    lineHeight: 16,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontWeight: '500',
  },
  title1: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontStyle: 'normal',
  },
  headline: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'Arial',
    fontWeight: '500',
    fontStyle: 'normal',
  },
});

// If Android, use Roboto font
androidStyle = StyleSheet.create({
  font: {
    fontFamily: 'Roboto',
  },
});

export {
  Caption,
  Body1,
  Body2,
  Subheading1,
  Subheading2,
  Subheading3,
  Title1,
  Headline,
  fontStyles,
};
