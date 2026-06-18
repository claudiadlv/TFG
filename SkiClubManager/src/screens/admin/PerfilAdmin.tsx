import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';
import styles from '../../styles/PerfilAdmin.styles';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types/types';

export default function PerfilAdmin() {
  const { logout } = useAuth();

  const [usuario, setUsuario] = useState<{ id: number; nombre: string } | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();

  useEffect(() => {
    const fetchNombre = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/usuarios/yo`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Usuario actual:', data);
          setUsuario({ id: data.id, nombre: data.nombre });
        } else {
          console.log('Error al obtener el usuario:', response.status);
        }
      } catch (error) {
        console.error('Error al cargar el usuario:', error);
      }
    };

    fetchNombre();
  }, []);

  const handleLogout = async () => {
    await logout();
    Alert.alert('Sesión cerrada', 'Has cerrado sesión correctamente');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 80 }]}>
        <View style={styles.iconCircle}>
          <Icon name="person-outline" size={40} color="#4A56E2" />
        </View>

        <Text style={styles.title}>
          {usuario?.nombre ?? 'Administrador'}
        </Text>

        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('AsistenciaPista')}
        >
          <View style={styles.iconWrapper}>
            <Icon name="flag-outline" size={20} color="white" />
          </View>
          <Text style={styles.optionText}>Asistencia a los entrenos</Text>
          <Icon name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('AdministrarTransporte')}
        >
          <View style={styles.iconWrapper}>
            <Icon name="bus-outline" size={20} color="white" />
          </View>
          <Text style={styles.optionText}>Administrar transporte</Text>
          <Icon name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('AdministrarUsuarios')}
        >
          <View style={styles.iconWrapper}>
            <Icon name="people-outline" size={20} color="white" />
          </View>
          <Text style={styles.optionText}>Administrar usuarios</Text>
          <Icon name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('ListaEntrenadores')}
        >
          <View style={styles.iconWrapper}>
            <Icon name="person-add-outline" size={20} color="white" />
          </View>
          <Text style={styles.optionText}>Administrar entrenador</Text>
          <Icon name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('GestionarDeportistas')}
        >
          <View style={styles.iconWrapper}> 
            <Icon name="snow-outline" size={20} color="white" />
          </View>
          <Text style={styles.optionText}>Gestionar deportistas</Text>
          <Icon name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionContainer}
          onPress={() => {
            if (usuario) {
              navigation.navigate('CambiarContrasena', { user: usuario });
            } else {
              Alert.alert('Error', 'No se han podido cargar los datos del perfil aún.');
            }
          }} 
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#FFB020' }]}> 
            <Icon name="lock-closed-outline" size={20} color="white" />
          </View>
          <Text style={styles.optionText}>Gestionar contraseña</Text>
          <Icon name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>Salir de la cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}