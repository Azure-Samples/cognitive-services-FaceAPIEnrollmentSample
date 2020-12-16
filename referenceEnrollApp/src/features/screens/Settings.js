import React, {useState, useEffect} from 'react';

import {View, StyleSheet, BackHandler, TextInput} from 'react-native';
import {Headline, fontStyles, Subheading1} from '../../styles/fontStyles';
import {validatePersonGroup} from '../shared/helper';
import {CONFIG} from '../../env/env.json';
import CustomButton from '../../styles/CustomButton';
import Modal from '../../styles/Modal';
import * as constants from '../../shared/constants';

function Settings({navigation}) {
  useEffect(() => {
    // Disables Android hardware back button
    BackHandler.addEventListener('hardwareBackPress', () => true);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', () => true);
  }, []);

  const [keyFocused, setKeyFocused] = useState(false);
  const [keyInput, setKeyInput] = useState(constants.FACEAPI_KEY);
  const [error, setError] = useState(false);

  const [modalProps, setModalProps] = useState(null);

  async function setValues() {
    setError(false);
    constants.FACEAPI_KEY = keyInput;
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

      {modalProps ? (
        <Modal {...modalProps}></Modal>
      ) : (
        <View style={styles.centerRow}>
          <View style={[styles.column1, {flex: 3, maxWidth: 300}]}>
            <Headline style={styles.headlineMargin}>Enter FaceAPI Key</Headline>

            <TextInput
              style={
                keyFocused
                  ? {...styles.textInputFocus, ...fontStyles.subheading1}
                  : {...styles.textInputStyle, ...fontStyles.subheading1}
              }
              placeholder="Subscription key"
              secureTextEntry={false}
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
                Key is invalid
              </Subheading1>
            ) : (
              <View style={{marginTop: 42}} />
            )}

            <View style={styles.buttonStyle}>
              <CustomButton
                title="OK"
                style={{width: 100}}
                onPress={setValues}
              />
            </View>
          </View>
          <View style={styles.column1} />
        </View>
      )}
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
