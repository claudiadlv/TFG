// Este código define un stack navigator para la aplicación de un entrenador de esquí.
// El stack navigator permite navegar entre diferentes pantallas de la aplicación.

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminTabs from './AdminTabs';
import DetalleEntrenamiento from '../../screens/admin/DetalleEntrenamiento';
import { AdminStackParamList} from '../types/types';
import GaleriaScreen from '../../screens/admin/GaleriaAdmin';
import AdministrarUsuarios from '../../screens/admin/AdministrarUsuarios';
import AdministrarEntrenador from '../../screens/admin/AdministrarEntrenador';
import ListaEntrenadores from '../../screens/admin/ListaEntrenadores';
import EditarEntrenador from '../../screens/admin/EditarEntrenador';
import AsistenciaPista from '../../screens/admin/AsistenciaPista';
import AdministrarTransporte from '../../screens/admin/AdministrarTransporte';
import CambiarContrasena from '../../screens/comun/CambiarContraseña';
import GestionarDeportistas from '../../screens/admin/GestionarDeportistas';
import DetallePadreHijos from '../../screens/admin/DetallePadreHijos';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="InicioAdmin"
        component={AdminTabs}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="DetalleEntrenamiento"
        component={DetalleEntrenamiento}
        options={{ title: 'Detalle del Entrenamiento' }}
      />

      <Stack.Screen
        name="GaleriaAdmin"
        component={GaleriaScreen}
        options={{ title: 'Galería' }}
      />

      <Stack.Screen
        name="AdministrarUsuarios"
        component={AdministrarUsuarios}
        options={{ title: 'Administrar usuarios' }}
      />

      <Stack.Screen
        name="AdministrarEntrenador"
        component={AdministrarEntrenador}
        options={{ title: 'Administrar Entrenador' }}
      />

      <Stack.Screen
        name="ListaEntrenadores"
        component={ListaEntrenadores}
        options={{ title: 'Lista de Entrenadores' }}
      />
      <Stack.Screen
        name="EditarEntrenador"
        component={EditarEntrenador}
        options={{ title: 'Editar Entrenador' }}
      />

      <Stack.Screen
        name="AsistenciaPista"
        component={AsistenciaPista}
        options={{ title: 'Asistencia a los entrenamientos' }}
      />
      
      <Stack.Screen
        name="AdministrarTransporte"
        component={AdministrarTransporte}
        options={{ title: 'Administrar Transporte' }}
      />

      <Stack.Screen
        name="CambiarContrasena"
        component={CambiarContrasena}
        options={{ title: 'Cambiar Contraseña' }}
      />
      <Stack.Screen
        name="GestionarDeportistas"
        component={GestionarDeportistas}
        options={{ title: 'Gestionar Deportistas' }}
      />
      <Stack.Screen
        name="DetallePadreHijos"
        component={DetallePadreHijos}
        options={{ title: 'Detalle del Padre o Tutor' }}
      />
    </Stack.Navigator>
  );
}