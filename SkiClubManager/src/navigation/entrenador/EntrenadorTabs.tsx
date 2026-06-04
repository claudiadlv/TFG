import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeEntrenador from '../../screens/entrenador/HomeEntrenador';
import CalendarioEntrenador from '../../screens/entrenador/CalendarioEntrenador';
import PerfilEntrenador from '../../screens/entrenador/PerfilEntrenador';
import GaleriaEntrenador from '../../screens/entrenador/GaleriaEntrenador';

const Tab = createBottomTabNavigator();

export default function EntrenadorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = '';

          switch (route.name) {
            case 'INICIO':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'CALENDARIO':
                iconName = focused ? 'calendar' : 'calendar-outline';
                break;
            case 'GALERIA':
              iconName = focused ? 'images' : 'images-outline';
              break;
            case 'PERFIL':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1E88E5',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 0.5,
          borderTopColor: '#ccc',
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: 3,
        },
      })}
    >
      <Tab.Screen name="INICIO" component={HomeEntrenador} />
      <Tab.Screen name="CALENDARIO" component={CalendarioEntrenador} />
      <Tab.Screen name="GALERIA" component={GaleriaEntrenador} />
      <Tab.Screen name="PERFIL" component={PerfilEntrenador} />
    </Tab.Navigator>
  );
}
