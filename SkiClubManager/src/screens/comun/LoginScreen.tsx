import React, { useState } from 'react';
import { View, Text, TextInput, Alert, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types/types';
import { API_URL } from '../../config';
import styles from '../../styles/Login.styles';
import { useAuth } from '../../context/AuthContext'; 

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    console.log('Intentando login');

    if (!username || !password) {
      Alert.alert('Error', 'Debes completar usuario y contraseña');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo: username,
          contrasena: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Datos recibidos del backend:', data);

        const accessToken = data?.accessToken;
        const refreshToken = data?.refreshToken;
        const rol = data?.usuario?.rol;

        if (!accessToken || !refreshToken || !rol) {
          console.log('Faltan tokens o rol:', { accessToken, refreshToken, rol });
          Alert.alert('Error', 'Respuesta del servidor incompleta');
          return;
        }

        if (rol === 'admin' || rol === 'entrenador' || rol === 'padre') {
          await login(accessToken, refreshToken, rol); 
        } else {
          Alert.alert('Error', 'Rol no reconocido');
        }
      } else {
        const status = response.status;
        const errorText = await response.text();
        console.log(`Error HTTP ${status}:`, errorText);

        // --- SOLUCIÓN: PARSEO DEL MENSAJE DE ERROR ---
        try {
          const errorJson = JSON.parse(errorText);
          // Si el backend tiene la clave 'mensaje', la extraemos; si no, dejamos un fallback
          const mensajeLimpio = errorJson.mensaje || errorJson.message || 'Credenciales inválidas';
          
          Alert.alert('Acceso Denegado', mensajeLimpio, [{ text: 'OK' }]);
        } catch {
          // Fallback por si el servidor no responde con un JSON válido
          Alert.alert('Error', 'Usuario o contraseña incorrectos.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error de Conexión', 'No se pudo conectar con el servidor');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../img/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Inicio</Text>
      <TextInput
        style={styles.input}
        placeholder="Usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.registerText}>¿Has olvidado tu contraseña?</Text>
      </TouchableOpacity>
        
      <TouchableOpacity onPress={() => navigation.navigate('RegisterRequest')}>
        <Text style={styles.registerText}>¿No tienes usuario? Solicita tu registro</Text>
      </TouchableOpacity>
    </View>
  );
}