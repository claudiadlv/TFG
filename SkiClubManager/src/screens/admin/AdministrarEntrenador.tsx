import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import styles from '../../styles/AdministrarEntrenador.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';
import { ScrollView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types/types';

export default function AdministrarEntrenador() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  
  const categoriasOpciones = ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'FIS'];
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();

  const handleCrearEntrenador = async () => {
    if (!nombre || !apellido || !correo || categoriasSeleccionadas.length === 0) {
      Alert.alert('Error', 'Por favor completa todos los campos y selecciona al menos una categoría.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/entrenadores`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          apellidos: apellido,
          correo,
          fechaNacimiento: fechaNacimiento.toISOString().split('T')[0],
          rol: 'entrenador',
          categoria: categoriasSeleccionadas, 
          contrasena: 'entrenador123',
        }),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Entrenador creado correctamente.', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
        setNombre('');
        setApellido('');
        setCorreo('');
        setFechaNacimiento(new Date());
        setCategoriasSeleccionadas([]);
      } else {
        console.log('Error al crear entrenador:', response.status);
        Alert.alert('Error', 'No se pudo crear el entrenador.');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar la solicitud.');
    }
  };

  const toggleCategoria = (cat: string) => {
    if (categoriasSeleccionadas.includes(cat)) {
      setCategoriasSeleccionadas(prev => prev.filter(c => c !== cat));
    } else {
      setCategoriasSeleccionadas(prev => [...prev, cat]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.containerForm}>
      <Text style={styles.titleForm}>Registrar Entrenador</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        style={styles.input}
        placeholder="Apellido"
        value={apellido}
        onChangeText={setApellido}
      />

      <TextInput
        style={styles.input}
        placeholder="Correo"
        keyboardType="email-address"
        autoCapitalize="none"
        value={correo}
        onChangeText={setCorreo}
      />

      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.datePickerText}>
          {`Fecha de nacimiento: ${fechaNacimiento.toLocaleDateString()}`}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={fechaNacimiento}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setFechaNacimiento(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}

      <Text style={{ marginTop: 15, marginBottom: 8, fontSize: 16, fontWeight: 'bold', color: '#333' }}>
        Asignar categorías:
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
        {categoriasOpciones.map((cat) => {
          const seleccionada = categoriasSeleccionadas.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => toggleCategoria(cat)}
              style={{
                backgroundColor: seleccionada ? '#0D47A1' : '#ccc',
                padding: 10,
                margin: 5,
                borderRadius: 8,
                minWidth: 60,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: seleccionada ? 'white' : 'black', fontWeight: '500' }}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.buttonForm} onPress={handleCrearEntrenador}>
        <Text style={styles.buttonTextForm}>Registrar Entrenador</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}