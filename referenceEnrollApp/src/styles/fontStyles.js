import React from 'react';
import {StyleSheet, Text} from 'react-native';

function Caption(props) {
  return (
    <Text
      style={[
        fontStyles.caption,
        props.style,
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
          props.style
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
        props.style
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
          props.style
        ]}>
        {props.children}
      </Text>
    </Subheading1>
  );
}

function Title1(props) {
  return (
    <Text
      style={[
        fontStyles.title1,
        props.style,
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
        props.style
      ]}>
      {props.children}
    </Text>
  );
}

const fontStyles = StyleSheet.create({
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Roboto-Regular',
    fontStyle: 'normal',
  },
  body1: {
    fontSize: 14,
  },
  body2: {
    fontFamily: 'Roboto-Medium',
  },
  subheading1: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Roboto-Regular',
    fontStyle: 'normal',
  },

  subheading2: {
    fontFamily: 'Roboto-Medium',
  },
  title1: {
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Roboto-Medium',
    fontStyle: 'normal',
  },
  headline: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: 'Roboto-Medium',
    fontStyle: 'normal',
  },
});


export {
  Caption,
  Body1,
  Body2,
  Subheading1,
  Subheading2,
  Title1,
  Headline,
  fontStyles,
};
