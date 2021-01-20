import React, {useState, useEffect} from 'react';

import {View, StyleSheet, BackHandler, TextInput} from 'react-native';
import {Headline, fontStyles, Subheading1} from '../../styles/fontStyles';
import {validatePersonGroup} from '../shared/helper';
import {CONFIG} from '../../env/env.json';
import CustomButton from '../../styles/CustomButton';
import * as constants from '../../shared/constants';

/*
This page is for development or testing purposes only, 
it exposes the faceAPI settings to the UI,
The page should be removed for production
*/
function Settings({navigation}) {
  useEffect(() => {
    // Disables Android hardware back button
    BackHandler.addEventListener('hardwareBackPress', () => true);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', () => true);
  }, []);

  // State
  const [keyFocused, setKeyFocused] = useState(false);
  const [endpointFocused, setEndpointFocused] = useState(false);
  const [keyInput, setKeyInput] = useState(constants.FACEAPI_KEY);
  const [endpointInput, setEndpointInput] = useState(
    constants.FACEAPI_ENDPOINT,
  );
  const [error, setError] = useState(false);

  async function setValues() {
    setError(false);
    constants.FACEAPI_KEY = keyInput;
    constants.FACEAPI_ENDPOINT = endpointInput;
    let validated = await validatePersonGroup(CONFIG.PERSONGROUP_RGB);

    if (validated) {
      navigation.navigate(constants.SCREENS.welcome);
    } else {
      setError(true);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.smallRow} />
      <View style={styles.centerRow}>
        <View style={[styles.column1, {flex: 3, maxWidth: 350}]}>
          <Headline style={styles.headlineMargin}>Settings</Headline>
          <Subheading1>FaceAPI credentials</Subheading1>
          <TextInput
            style={
              endpointFocused
                ? {...styles.textInputFocus, ...fontStyles.subheading1}
                : {...styles.textInputStyle, ...fontStyles.subheading1}
            }
            placeholder="Endpoint"
            secureTextEntry={false}
            value={endpointInput == '' ? null : endpointInput}
            onChangeText={(text) => {
              setEndpointInput(text);
              setError(false);
            }}
            onFocus={() => {
              setEndpointFocused(true);
            }}
            onBlur={() => {
              setEndpointFocused(false);
            }}
          />

          <TextInput
            style={
              keyFocused
                ? {...styles.textInputFocus, ...fontStyles.subheading1}
                : {...styles.textInputStyle, ...fontStyles.subheading1}
            }
            placeholder="Subscription key"
            secureTextEntry={true}
            value={keyInput == '' ? null : keyInput}
            onChangeText={(text) => {
              setKeyInput(text);
              setError(false);
            }}
            onFocus={() => {
              setKeyFocused(true);
            }}
            onBlur={() => {
              setKeyFocused(false);
            }}
          />

          {error ? (
            <Subheading1 style={{marginTop: 20, color: 'red'}}>
              Credentials are not valid
            </Subheading1>
          ) : (
            <View style={{marginTop: 42}} />
          )}

          <View style={styles.buttonStyle}>
            <CustomButton title="OK" style={{width: 100}} onPress={setValues} />
          </View>
        </View>
        <View style={styles.column1} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E5E5',
    flexDirection: 'column',
  },
  centerRow: {
    flex: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingLeft: 60,
    maxWidth: 840,
  },
  smallRow: {
    flex: 1,
  },
  column1: {
    flex: 1,
    flexDirection: 'column',
  },
  textInputStyle: {
    borderColor: '#E1E1E1',
    borderBottomWidth: 2,
    marginTop: 20,
  },
  textInputFocus: {
    borderColor: '#0078D4',
    borderBottomWidth: 2,
    marginTop: 20,
  },
  headlineMargin: {
    marginBottom: 50,
    marginTop: 10,
  },
  buttonStyle: {
    marginTop: 100,
    alignItems: 'flex-start',
  },
});

export default Settings;
