import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PadreTabs from './PadreTabs';
import { PadreStackParamList } from '../types/types';
import GaleriaPadre from '../../screens/padre/GaleriaPadre';
import CalendarioPadre from '../../screens/padre/CalendarioPadre';
import PerfilPadre from '../../screens/padre/PerfilPadre';  
import GestionarPerfil from '../../screens/padre/GestionarPerfil';  
import AnadirHijoScreen from '../../screens/padre/AnadirHijo';
import DetalleEventoPadreApuntar from '../../screens/padre/DetalleEventoPadreApuntar';
import DetalleEventoPadreDesapuntar from '../../screens/padre/DetalleEventoPadreDesapuntar';
import AsistenciaPista from '../../screens/padre/AsistenciaHijoPista'; 
import AsistenciaTransporte from '../../screens/padre/AsistenciaTransporte';

const Stack = createNativeStackNavigator<PadreStackParamList>();

export default function PadreNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="InicioPadre"
        component={PadreTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GaleriaPadre"
        component={GaleriaPadre}
        options={{ title: 'Galería' }}
      />
      <Stack.Screen
        name="CalendarioPadre"
        component={CalendarioPadre}
        options={{ title: 'Calendario' }}
      />
      <Stack.Screen
        name="PerfilPadre"
        component={PerfilPadre}
        options={{ title: 'Perfil' }}
      />
      <Stack.Screen 
        name="GestionarPerfil" 
        component={GestionarPerfil} 
        options={{ title: 'Perfil del Deportista' }}
      />
      <Stack.Screen 
        name="AnadirHijo" 
        component={AnadirHijoScreen} 
        options={{ title: 'Añadir Hijo' }}
      />

      {/* Pantallas de detalle */}
      <Stack.Screen
        name="DetalleEventoPadreApuntar"
        component={DetalleEventoPadreApuntar}
        options={{ title: 'Detalle del Entreno' }}
      />
      <Stack.Screen
        name="DetalleEventoPadreDesapuntar"
        component={DetalleEventoPadreDesapuntar}
        options={{ title: 'Detalle del Entreno' }}
      />

      {/* NUEVA PANTALLA ASISTENCIA */}
      <Stack.Screen
        name="AsistenciaPista"
        component={AsistenciaPista}
        options={{ title: 'Asistencia a pista' }}
      />

      <Stack.Screen
        name="AsistenciaTransporte"
        component={AsistenciaTransporte}
        options={{ title: 'Transporte' }}
      />
    </Stack.Navigator>
  );
}
