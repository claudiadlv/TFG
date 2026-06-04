import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from '../../config';
import styles from '../../styles/AdministrarEntrenador.styles';
import { AdminStackParamList } from '../../navigation/types/types';

type EditarEntrenadorRouteProp = RouteProp<AdminStackParamList, 'EditarEntrenador'>;

export default function EditarEntrenador() {
  const route = useRoute<EditarEntrenadorRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const { entrenadorId } = route.params;

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Estado adaptado para el array de categorías del entrenador
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  // Nomenclatura actualizada: 'U18' pasa a ser 'FIS'
  const categoriasOpciones = ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'FIS'];

  useEffect(() => {
    const fetchEntrenador = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const response = await fetch(`${API_URL}/admin/entrenadores/${entrenadorId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setNombre(data.nombre);
          setApellido(data.apellidos);
          setCorreo(data.correo);

          // Parseo seguro del string de la base de datos a Array tipado
          if (data.categoria) {
            if (Array.isArray(data.categoria)) {
              setCategoriasSeleccionadas(data.categoria);
            } else if (typeof data.categoria === 'string') {
              setCategoriasSeleccionadas(data.categoria.split(',').map((c: string) => c.trim()));
            }
          }

          if (data.fecha_nacimiento) {
            setFechaNacimiento(new Date(data.fecha_nacimiento));
          }
        } else {
          console.log('Error al cargar entrenador:', response.status);
          Alert.alert('Error', 'No se pudo cargar el entrenador.');
        }
      } catch (error) {
        console.error('Error al cargar entrenador:', error);
        Alert.alert('Error', 'Error de conexión.');
      }
    };

    fetchEntrenador();
  }, [entrenadorId]);

  const handleActualizarEntrenador = async () => {
    if (!nombre || !apellido || !correo || categoriasSeleccionadas.length === 0) {
      Alert.alert('Error', 'Por favor completa todos los campos y selecciona al menos una categoría.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/entrenadores/${entrenadorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre,
          apellidos: apellido,
          correo,
          fecha_nacimiento: fechaNacimiento.toISOString().split('T')[0],
          rol: 'entrenador',
          categoria: categoriasSeleccionadas, // Enviamos el array al backend
        }),
      });

      if (response.ok) {
        Alert.alert('Éxito', 'Entrenador actualizado correctamente.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        console.log('Error al actualizar:', response.status);
        Alert.alert('Error', 'No se pudo actualizar el entrenador.');
      }
    } catch (error) {
      console.error('Error al actualizar entrenador:', error);
      Alert.alert('Error', 'Error de conexión.');
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Datos</Text>

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

      {/* Título de sección adaptado con estilo inline */}
      <Text style={{ marginTop: 15, marginBottom: 8, fontSize: 16, fontWeight: 'bold', color: '#333' }}>
        Categorías asignadas:
      </Text>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
        {categoriasOpciones.map((cat) => {
          const seleccionada = categoriasSeleccionadas.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => toggleCategoria(cat)}
              style={{
                backgroundColor: seleccionada ? '#003366' : '#ccc',
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

      <TouchableOpacity style={styles.button} onPress={handleActualizarEntrenador}>
        <Text style={styles.buttonText}>Actualizar Entrenador</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}