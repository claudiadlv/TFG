// Este código define un stack navigator para la aplicación de un entrenador de esquí.
// El stack navigator permite navegar entre diferentes pantallas de la aplicación.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EntrenadorTabs from './EntrenadorTabs';
import CrearEvento from '../../screens/entrenador/CrearEvento';
import EventoCreado from '../../screens/entrenador/EventoCreado';
import DetalleEntrenamiento from '../../screens/entrenador/DetalleEntrenamiento';
import ModificarEntrenamiento from '../../screens/entrenador/ModificarEntrenamiento';
import { EntrenadorStackParamList } from '../types/types';
import GaleriaScreen from '../../screens/entrenador/GaleriaEntrenador';
import AsistenciaEntrenamiento from '../../screens/entrenador/AsistenciaEntrenamiento';
import AsistenciaPista from '../../screens/entrenador/AsistenciaPista';
import AdministrarTransporte from '../../screens/entrenador/AdministrarTransporte';

const Stack = createNativeStackNavigator<EntrenadorStackParamList>();

export default function EntrenadorNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="InicioEntrenador"
        component={EntrenadorTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CrearEvento"
        component={CrearEvento}
        options={{ title: 'Crear evento' }}
      />
      <Stack.Screen
        name="EventoCreado"
        component={EventoCreado}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="DetalleEntrenamiento"
        component={DetalleEntrenamiento}
        options={{ title: 'Detalle del Entrenamiento' }}
      />

      <Stack.Screen
        name="ModificarEntrenamiento"
        component={ModificarEntrenamiento}
        options={{ title: 'Modificar' }}
      />

      <Stack.Screen
        name="GaleriaEntrenador"
        component={GaleriaScreen}
        options={{ title: 'Galería' }}
      />

      <Stack.Screen
        name="AsistenciaEntrenamiento"
        component={AsistenciaEntrenamiento}
        options={{ title: 'Asistencia' }}
      />
      <Stack.Screen
        name="AsistenciaPista"
        component={AsistenciaPista}
        options={{ title: 'Asistencia Pista' }}
      />

      <Stack.Screen
        name="AdministrarTransporte"
        component={AdministrarTransporte}
        options={{ title: 'Administrar Transporte' }}
      />
    </Stack.Navigator>
  );
}