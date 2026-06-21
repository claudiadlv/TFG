import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types/types';
import { API_URL } from '../../config';
import styles from '../../styles/Login.styles';

export default function ContraseñaOlvidada() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert('Atención', 'Introduce tu correo electrónico');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email }),
      });
      
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Enviado', data.mensaje || 'Revisa tu correo para obtener el código.');
        setStep(2);
      } else {
        Alert.alert('Error', data.mensaje || 'No encontramos ese usuario en el Club.');
      }
    } catch (error) {
      console.error('Error en handleRequestCode:', error);
      Alert.alert('Error', 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!token || !newPassword || !confirmPassword) {
      Alert.alert('Atención', 'Todos los campos son obligatorios.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'El código o las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Éxito', data.mensaje || 'Contraseña actualizada. Ya puedes entrar.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Error', data.mensaje || 'El código es inválido o ha caducado.');
      }
    } catch (error) {
      console.error('Error en handleReset:', error);
      Alert.alert('Error', 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Cuenta</Text>
      
      {step === 1 ? (
        <>
          <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
            Te enviaremos un código de seguridad al email.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.loginButton} onPress={handleRequestCode} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Enviar Código</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={{ textAlign: 'center', marginBottom: 20, color: '#666' }}>
            Introduce el código recibido y tu nueva contraseña.
          </Text>
          <TextInput 
            style={styles.input} 
            placeholder="Código de 6 dígitos" 
            value={token} 
            onChangeText={setToken} 
            keyboardType="number-pad"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Nueva Contraseña" 
            value={newPassword} 
            onChangeText={setNewPassword} 
            secureTextEntry 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Repetir Contraseña" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            secureTextEntry 
          />
          <TouchableOpacity style={styles.loginButton} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Cambiar Contraseña</Text>}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 20 }}>
        <Text style={styles.registerText}>Volver al Inicio</Text>
      </TouchableOpacity>
    </View>
  );
}