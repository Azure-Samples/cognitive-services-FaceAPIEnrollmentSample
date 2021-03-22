import React, {useEffect} from 'react';

import {
  View,
  StyleSheet,
  BackHandler,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {
  Caption,
  Headline,
  Subheading1,
  Subheading2,
  Body1,
  Body2,
} from '../../styles/fontStyles';
import CustomButton from '../../styles/CustomButton';
import {StackActions} from '@react-navigation/native';
import {HeaderBackButton} from '@react-navigation/stack';
import {getIsPortrait} from '../portrait/isPortrait';

function Receipt({navigation}) {
  getIsPortrait();
  var screenWidth = Dimensions.get('window').width;

  React.useLayoutEffect(() => {
    // Back button goes to Welcome page
    navigation.setOptions({
      headerLeft: () => {
        return (
          <HeaderBackButton
            tintColor="white"
            onPress={() => {
              navigation.dispatch(StackActions.popToTop());
            }}
          />
        );
      },
    });
  }, [navigation]);

  useEffect(() => {
    // Disables Android hardware back button
    BackHandler.addEventListener('hardwareBackPress', () => true);
    return () =>
      BackHandler.removeEventListener('hardwareBackPress', () => true);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.centerRow}>
        <View style={styles.column1}>
          <View style={{marginBottom: 30}}>
            <Caption>Step 3 of 3</Caption>

            <View style={styles.headlineMargin}>
              <Image
                style={styles.iconFormat}
                source={require('../../assets/icon_check.png')}
              />
              <Headline>You’re enrolled!</Headline>
            </View>
            <Subheading1>
              You can now use touchless access to enter work buildings.
            </Subheading1>
          </View>

          <View>
            <View style={styles.column1}>
              <View>
                <Body2 style={styles.blueheading}>
                  Summary of data being stored
                </Body2>
              </View>
              <View style={styles.borderLine}></View>
              <View style={styles.borderLine}>
                <View style={[styles.rowNoFlex, {height: 100}]}>
                  <View style={[{flex: 1}]}>
                    <View style={{marginBottom: 10}}>
                      <Subheading2>Your face template</Subheading2>
                    </View>

                    <Body1>Used to unlock touchless access doors</Body1>
                  </View>
                  <View style={{flex: 1}}>
                    <Image
                      style={styles.imgFormat}
                      source={require('../../assets/img_faceTemp_s.png')}
                    />
                  </View>
                </View>
                <View style={styles.rowNoFlex}>
                  <Image
                    style={styles.iconFormat}
                    source={require('../../assets/icon_key.png')}
                  />
                  <View style={styles.column1}>
                    <Body2>Who has access</Body2>
                    <Body1>No one</Body1>
                  </View>
                </View>
                <View style={styles.rowNoFlex}>
                  <Image
                    style={styles.iconFormat}
                    source={require('../../assets/icon_timer.png')}
                  />
                  <View style={styles.column1}>
                    <Body2>How long it’s stored</Body2>
                    <Body1>
                      For the duration of your employment or until you delete
                      your data
                    </Body1>
                  </View>
                </View>
              </View>
              <View style={styles.borderLine}>
                <View style={[styles.smallRow, styles.shadeBox]}>
                  <View style={styles.column1}>
                    <View style={styles.titleMargin}>
                      <Body2>Manage your profile</Body2>
                    </View>
                    <Body1>
                      You can visit the lobby kiosk anytime to delete your face
                      template.
                    </Body1>
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.column1]}>
              <View style={styles.titleMargin}>
                <Body2 style={styles.blueheading}>
                  What to expect at the door
                </Body2>
              </View>
              <View style={styles.rowNoFlex}>
                <Body1>{'\u2022'}</Body1>
                <Body1>Look at the camera sensor</Body1>
              </View>

              <View style={styles.rowNoFlex}>
                <Body1>{'\u2022'}</Body1>
                <Body1>Touchless access verifies your face template</Body1>
              </View>

              <View style={styles.rowNoFlex}>
                <Body1>{'\u2022'}</Body1>
                <Body1>
                  The sensor lights up to let you know what’s happening
                </Body1>
              </View>
              <View style={styles.borderLine}>
                <View style={{height: 127, marginBottom: 10}}>
                  <Image
                    style={styles.imgFormat}
                    source={require('../../assets/img_sensorLights.png')}
                  />
                </View>
              </View>

              <View style={styles.titleMargin}>
                <Body2 style={styles.blueheading}>
                  What to do if the door doesn’t open
                </Body2>
              </View>
              <Body1>
                If your face template can’t be verified, the door stays locked.
                Simply scan your badge to enter.
                {'\n \n'}
                Email GlobalSecurity@contoso.com to troubleshoot.
              </Body1>
            </View>
          </View>

          <View
            style={{
              marginTop: 25,
              marginBottom: 30,
              flexDirection: 'column',
            }}>
            <CustomButton
              title="Back to home"
              style={styles.buttonStyle}
              onPress={() => {
                navigation.dispatch(StackActions.popToTop());
              }}
            />
          </View>
        </View>

        <View style={screenWidth >= 600 ? { flex: 5 } : {}}></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'white',
    flexDirection: 'column',
  },
  centerRow: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 80,
    paddingLeft: 16,
    paddingRight: 16,
    maxWidth: 840,
  },
  borderLine: {
    borderBottomWidth: 1,
    paddingBottom: 20,
    marginBottom: 20,
    borderColor: '#E1E1E1',
  },
  iconFormat: {
    resizeMode: 'contain',
    height: 25,
    width: 25,
    marginRight: 15,
  },
  smallRow: {
    flex: 1,
    marginBottom: 20,
    flexDirection: 'row',
  },
  rowNoFlex: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  column1: {
    flex: 7,
    flexDirection: 'column',
  },
  imgFormat: {
    flex: 1,
    width: null,
    height: null,
    borderRadius: 4,
    resizeMode: 'contain',
  },
  shadeBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 4,
    padding: 10,
  },
  headlineMargin: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  titleMargin: {
    marginBottom: 10,
  },
  buttonStyle: {
    marginTop: 20,
    width: 140,
  },
  blueheading: {
    color: '#0078D4',
  },
});

export default Receipt;
