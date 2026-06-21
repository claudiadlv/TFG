import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import styles from '../../styles/AnadirHijo.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

export default function AnadirHijoScreen() {
  const { accessToken } = useAuth();
  const navigation = useNavigation();
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const onChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setFechaNacimiento(selectedDate);
  };

  const handleSubmit = async () => {
    if (!nombre || !apellidos) {
      Alert.alert('Error', 'Debes rellenar nombre y apellidos');
      return;
    }

    try {
      console.log('Insertando hijo con:', { nombre, apellidos, fechaNacimiento });

      const response = await fetch(`${API_URL}/deportista/anadir_hijo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          apellidos,
          fecha_nacimiento: fechaNacimiento.toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error al añadir hijo:', errorText);
        throw new Error('No se pudo añadir el hijo');
      }

      Alert.alert('Éxito', 'Hijo añadido correctamente', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error al añadir hijo:', error.message);
      Alert.alert('Error', 'No se pudo añadir el hijo');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Añadir hijo</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del hijo"
        value={nombre}
        onChangeText={setNombre}
      />

      <Text style={styles.label}>Apellidos</Text>
      <TextInput
        style={styles.input}
        placeholder="Apellidos del hijo"
        value={apellidos}
        onChangeText={setApellidos}
      />

      <Text style={styles.label}>Fecha de nacimiento</Text>
      <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
        <Text style={styles.dateText}>
          {fechaNacimiento.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={fechaNacimiento}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Registrar hijo</Text>
      </TouchableOpacity>
    </View>
  );
}
