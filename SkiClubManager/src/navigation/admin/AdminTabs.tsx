import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import HomeAdmin from '../../screens/admin/HomeAdmin';
import CalendarioAdmin from '../../screens/admin/CalendarioAdmin';
import PerfilAdmin from '../../screens/admin/PerfilAdmin';
import GaleriaAdmin from '../../screens/admin/GaleriaAdmin'; // si ya tienes una versión admin, cámbiala

import { AdminTabParamList } from '../types/types'; // asegúrate de tener este tipo

const Tab = createBottomTabNavigator<AdminTabParamList>();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = '';

          switch (route.name) {
            case 'HomeAdmin':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Calendario':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'GaleriaAdmin':
              iconName = focused ? 'images' : 'images-outline';
              break;
            case 'PerfilAdmin':
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
      <Tab.Screen name="HomeAdmin" component={HomeAdmin} />
      <Tab.Screen name="Calendario" component={CalendarioAdmin} />
      <Tab.Screen name="GaleriaAdmin" component={GaleriaAdmin} />
      <Tab.Screen name="PerfilAdmin" component={PerfilAdmin} />
    </Tab.Navigator>
  );
}
