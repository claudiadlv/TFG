import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { API_URL } from '../../config';
import styles from '../../styles/PerfilEntrenador.styles'; 
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';

export default function CambiarContrasena() {
  const route = useRoute<any>(); 
  const navigation = useNavigation<any>();

  const { user } = route.params || {};

  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // 1. Validación previa de campos vacíos
    if (!contrasenaActual || !nuevaContrasena || !confirmarContrasena) {
      Alert.alert('Atención', 'Todos los campos son obligatorios.');
      return;
    }

    // 2. Validación robusta con aviso genérico de seguridad
    if (nuevaContrasena !== confirmarContrasena || nuevaContrasena.length < 6) {
      Alert.alert(
        'No se pudo actualizar',
        'Los datos introducidos no son válidos. Por favor, verifica la información e inténtalo de nuevo.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: user.id,
          contrasenaActual,
          nuevaContrasena,
        }),
      });

      await response.json();

      if (response.ok) {
        Alert.alert('¡Éxito!', 'La contraseña se ha actualizado correctamente.', [
          { text: 'Estupendo', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
          'No se pudo actualizar',
          'Los datos introducidos no son válidos. Por favor, verifica la información e inténtalo de nuevo.'
        );
      }
    } catch (error) {
      console.error('Error en change password fetch:', error);
      Alert.alert('Error de conexión', 'No se pudo establecer comunicación con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#F8F9FA' }}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <View style={[styles.iconCircle, { backgroundColor: '#E8EAFB' }]}>
            <Icon name="shield-checkmark-outline" size={40} color="#4A56E2" />
          </View>
          <Text style={[styles.title, { marginTop: 15 }]}>Actualizar Contraseña</Text>
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 5, paddingHorizontal: 10 }}>
            Hola, {user.nombre}. Modifica la contraseña de tu cuenta.
          </Text>
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontWeight: '600', marginBottom: 5, color: '#333' }}>Contraseña actual</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12 }]}
            placeholder="Introduce la contraseña actual"
            value={contrasenaActual}
            onChangeText={setContrasenaActual}
            secureTextEntry
          />
        </View>

        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontWeight: '600', marginBottom: 5, color: '#333' }}>Nueva contraseña</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12 }]}
            placeholder="Mínimo 6 caracteres"
            value={nuevaContrasena}
            onChangeText={setNuevaContrasena}
            secureTextEntry
          />
        </View>

        <View style={{ marginBottom: 25 }}>
          <Text style={{ fontWeight: '600', marginBottom: 5, color: '#333' }}>Confirmar nueva contraseña</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12 }]}
            placeholder="Repite la nueva contraseña"
            value={confirmarContrasena}
            onChangeText={setConfirmarContrasena}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}