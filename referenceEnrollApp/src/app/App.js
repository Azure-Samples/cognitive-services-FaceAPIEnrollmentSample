import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
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
        <Stack.Navigator screenOptions={{ title: '', gestureEnabled: false, headerStyle: { backgroundColor: '#0078D4' } }}>
          <Stack.Screen
            options={{ headerShown: false }}
            name={constants.SCREENS.welcome}
            component={Welcome}
          />

          <Stack.Screen
            options={{ headerShown: false }}
            name={'Settings'}
            component={Settings}
          />

          <Stack.Screen
            name={constants.SCREENS.manage}
            component={ManageProfile}
          />
          <Stack.Screen
            name={constants.SCREENS.consent}
            component={Consent}
          />
          <Stack.Screen
            name={constants.SCREENS.login}
            component={Login}
          />
          <Stack.Screen
            name={constants.SCREENS.instruction}
            component={Instruction}
          />
          <Stack.Screen
            options={{ headerShown: false }}
            name={constants.SCREENS.imageCapture}
            component={ImageCapture}
          />
          <Stack.Screen
            name={constants.SCREENS.receipt}
            component={Receipt}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;
