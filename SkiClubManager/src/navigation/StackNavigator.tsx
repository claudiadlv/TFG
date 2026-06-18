import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/comun/LoginScreen';
import RegisterRequestScreen from '../screens/padre/RegisterRequestScreen';
import AdminNavigator from './admin/AdminNavigator';
import EntrenadorNavigator from './entrenador/EntrenadorNavigator';
import PadreNavigator from './padre/PadreNavigator';
import { RootStackParamList } from './types/types';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordScreen from '../screens/comun/ForgotPassword'; // Asegúrate de importar tu nueva pantalla

const Stack = createNativeStackNavigator<RootStackParamList>();


export default function StackNavigator() {
  const { accessToken, rol, isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="RegisterRequest" component={RegisterRequestScreen} />
        </>
      ) : rol === 'admin' ? (
        <Stack.Screen name="AdminStack" component={AdminNavigator} />
      ) : rol === 'entrenador' ? (
        <Stack.Screen name="EntrenadorStack" component={EntrenadorNavigator} />
      ) : rol === 'padre' ? (
        <Stack.Screen name="PadreStack" component={PadreNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
