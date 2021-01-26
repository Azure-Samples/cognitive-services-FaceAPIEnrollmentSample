import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import ImageCapture from '../features/screens/ImageCapture';
import Login from '../features/screens/Login';
import Welcome from '../features/screens/Welcome';
import Consent from '../features/screens/Consent';
import Instruction from '../features/screens/Instruction';
import Receipt from '../features/screens/Receipt';
import ManageProfile from '../features/screens/ManageProfile';
import Settings from '../features/screens/Settings';
import { Provider } from 'react-redux';
import configureStore from './store';
const RNFS = require('react-native-fs');
import * as constants from '../shared/constants';


const Stack = createStackNavigator();
const store = configureStore();

const App = () => {
  /*
  To store username and personId information, this app writes the data
  to the enrollment directory created here. This is ONLY for demonstration purposes. 
  Any user information and personId should be stored in a secured, encrypted database. 
  A user's personId should be treated as a secret.
  */
  RNFS.mkdir(RNFS.DocumentDirectoryPath + '/enrollment/');

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            options={{ headerShown: false, gestureEnabled: false }}
            name={constants.SCREENS.welcome}
            component={Welcome}
          />

          <Stack.Screen
            options={{ headerShown: false, gestureEnabled: false }}
            name={'Settings'}
            component={Settings}
          />

          <Stack.Screen
            options={{ title: '', headerStyle: styles.header, gestureEnabled: false }}
            name={constants.SCREENS.manage}
            component={ManageProfile}
          />
          <Stack.Screen
            options={{
              title: '',
              headerStyle: styles.header, gestureEnabled: false
            }}
            name={constants.SCREENS.consent}
            component={Consent}
          />
          <Stack.Screen
            options={{ title: '', headerStyle: styles.header, gestureEnabled: false }}
            name={constants.SCREENS.login}
            component={Login}
          />
          <Stack.Screen
            options={{ title: '', headerStyle: styles.header, gestureEnabled: false }}
            name={constants.SCREENS.instruction}
            component={Instruction}
          />
          <Stack.Screen
            options={{ headerShown: false, gestureEnabled: false }}
            name={constants.SCREENS.imageCapture}
            component={ImageCapture}
          />
          <Stack.Screen
            options={{ title: '', headerStyle: styles.header, gestureEnabled: false }}
            name={constants.SCREENS.receipt}
            component={Receipt}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

var styles = StyleSheet.create({
  header: {
    backgroundColor: '#0078D4',
  },
});

export default App;
