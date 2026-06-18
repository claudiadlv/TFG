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
import { API_URL } from '../../config';
import styles from '../../styles/PerfilEntrenador.styles'; // Reutiliza tus estilos correctamente
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PadreStackParamList } from '../../navigation/types/types';

type NavigationProp = NativeStackNavigationProp<PadreStackParamList>;

export default function PerfilPadre() {
  const navigation = useNavigation<NavigationProp>();
  
  const [usuario, setUsuario] = useState<{ id: number; nombre: string } | null>(null);

  const { logout, accessToken } = useAuth();

  useEffect(() => {
    const fetchNombre = async () => {
      try {
        const response = await fetch(`${API_URL}/usuarios/yo`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsuario({ id: data.id, nombre: data.nombre });
        } else {
          Alert.alert('Error', 'No se pudo cargar la información del usuario');
        }
      } catch (error) {
        Alert.alert('Error', 'Ocurrió un error al conectar con el servidor');
      }
    };

    fetchNombre();
  }, [accessToken]);

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
          {usuario?.nombre ?? 'Padre/Madre'}
        </Text>

        {/* Botón Asistencia en pista */}
        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('AsistenciaPista')}
        >
          <View style={styles.iconWrapper}>
            <Icon name="flag-outline" size={20} color="white" />
          </View>
          <Text style={styles.optionText}>Asistencia a los entrenamientos</Text>
          <Icon name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('AsistenciaTransporte')}
        >
          <View style={styles.iconWrapper}>
            <Icon name="bus-outline" size={20} color="white" />
          </View>
          <Text style={styles.optionText}>Transporte</Text>
          <Icon name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        {/* Botón administrar usuario */}
        <TouchableOpacity
          style={styles.optionContainer}
          onPress={() => navigation.navigate('GestionarPerfil')}
        >
          <View style={styles.iconWrapper}>
            <Icon name="person-outline" size={20} color="white" />
          </View>
          <Text style={styles.optionText}>Administrar Usuario</Text>
          <Icon name="chevron-forward" size={24} color="#888" />
        </TouchableOpacity>

        {/* 🆕 NUEVO APARTADO: GESTIONAR CONTRASEÑA DEL PADRE */}
        <TouchableOpacity 
          style={styles.optionContainer}
          onPress={() => {
            if (usuario) {
              // Navegamos a la pantalla pasándole los datos del padre
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

        {/* Botón salir */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>Salir de la cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}