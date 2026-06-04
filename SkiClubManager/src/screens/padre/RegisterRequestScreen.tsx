import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types/types';
import styles from '../../styles/RegisterScreen.styles';
import { API_URL } from '../../config';

export default function RegisterRequestScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Estados para el Tutor
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [parentBirthdate, setParentBirthdate] = useState('');
  const [parentBirthdateDate, setParentBirthdateDate] = useState<Date | null>(null);
  const [showParentPicker, setShowParentPicker] = useState(false);

  // Estados para el Registrado (Hijo)
  const [name_reg, setName_reg] = useState('');
  const [surname_reg, setSurname_reg] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [birthdateDate, setBirthdateDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoria, setCategoria] = useState('');

  // Estados de Seguridad
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handlers de Fechas
  const onChangeDateHijo = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthdateDate(selectedDate);
      const formatted = formatDate(selectedDate);
      setBirthdate(formatted);
      setCategoria(calcularCategoria(selectedDate));
    }
  };

  const onChangeDateTutor = (event: any, selectedDate?: Date) => {
    setShowParentPicker(false);
    if (selectedDate) {
      setParentBirthdateDate(selectedDate);
      setParentBirthdate(formatDate(selectedDate));
    }
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatearFechaISO = (fecha: string): string => {
    if (!fecha) return '';
    const [dia, mes, anio] = fecha.split('/');
    return `${anio}-${mes}-${dia}`;
  };

  const calcularCategoria = (fecha: Date): string => {
    const anioNacimiento = fecha.getFullYear();
    const anioActual = new Date().getFullYear();
    const edadReferencia = anioActual - anioNacimiento;

    if (edadReferencia <= 8) return 'U8';
    if (edadReferencia <= 10) return 'U10';
    if (edadReferencia <= 12) return 'U12';
    if (edadReferencia <= 14) return 'U14';
    if (edadReferencia <= 16) return 'U16';
    return 'FIS';
  };

  const handleRequest = () => {
    // Validaciones básicas
    if (!name || !surname || !email || !parentBirthdate || !name_reg || !surname_reg || !birthdate || !password) {
      Alert.alert('Campos incompletos', 'Por favor rellena todos los datos obligatorios');
      return;
    }
    if (!validarEmail(email)) {
      Alert.alert('Email inválido', 'Introduce un correo válido');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    fetch(`${API_URL}/solicitudes-registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_tutor: name,
        apellidos_tutor: surname,
        correo_tutor: email,
        fecha_nacimiento_tutor: formatearFechaISO(parentBirthdate), 
        nombre_hijo: name_reg,
        apellidos_hijo: surname_reg,
        fecha_nacimiento_hijo: formatearFechaISO(birthdate), // <--- Asegúrate que se llame así
        contrasena: password,
        categoria: categoria,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        return res.json();
      })
      .then(() => {
        Alert.alert('Éxito', 'Solicitud enviada al administrador');
        navigation.navigate('Login');
      })
      .catch((err) => {
        console.error(err);
        Alert.alert('Error', 'No se pudo enviar la solicitud');
      });
  };

  const rellenarDatosPrueba = () => {
    setName('Claudia');
    setSurname('Pérez');
    setEmail(`claudia${Math.floor(Math.random() * 1000)}@ejemplo.com`);
    setParentBirthdate('15/05/1985');
    setParentBirthdateDate(new Date(1985, 4, 15));
    
    setName_reg('Lucía');
    setSurname_reg('Pérez');
    const fechaHijo = new Date(2012, 0, 1);
    setBirthdate('01/01/2012');
    setBirthdateDate(fechaHijo);
    setCategoria(calcularCategoria(fechaHijo));
    
    setPassword('Prueba123');
    setConfirmPassword('Prueba123');
  };

  const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../../img/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Solicitud de registro</Text>

      {/* SECCIÓN TUTOR */}
      <Text style={styles.label}>Nombre del tutor</Text>
      <TextInput style={styles.input} placeholder="Nombre" value={name} onChangeText={setName} />

      <Text style={styles.label}>Apellidos del tutor</Text>
      <TextInput style={styles.input} placeholder="Apellidos" value={surname} onChangeText={setSurname} />

      <Text style={styles.label}>Correo electrónico</Text>
      <TextInput style={styles.input} placeholder="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      <Text style={styles.label}>Fecha de nacimiento del tutor</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowParentPicker(true)}>
        <Text style={styles.textInsideInput}>{parentBirthdate || 'Seleccionar fecha'}</Text>
      </TouchableOpacity>

      {showParentPicker && (
        <DateTimePicker
          value={parentBirthdateDate || new Date(1985, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onChangeDateTutor}
        />
      )}

      <View style={{ height: 2, backgroundColor: '#eee', marginVertical: 20 }} />

      {/* SECCIÓN REGISTRADO */}
      <Text style={styles.label}>Nombre del deportista</Text>
      <TextInput style={styles.input} placeholder="Nombre" value={name_reg} onChangeText={setName_reg} />

      <Text style={styles.label}>Apellidos del deportista</Text>
      <TextInput style={styles.input} placeholder="Apellidos" value={surname_reg} onChangeText={setSurname_reg} />

      <Text style={styles.label}>Fecha de nacimiento del deportista</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.textInsideInput}>{birthdate || 'Seleccionar fecha'}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={birthdateDate || new Date(2010, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={onChangeDateHijo}
        />
      )}

      <Text style={styles.label}>Categoría (Cálculo automático)</Text>
      <TextInput style={[styles.input, { backgroundColor: '#f0f0f0' }]} value={categoria} editable={false} />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />

      <Text style={styles.label}>Repetir contraseña</Text>
      <TextInput style={styles.input} placeholder="Repite la contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      <TouchableOpacity onPress={rellenarDatosPrueba} style={{ backgroundColor: '#ccc', padding: 10, borderRadius: 8, marginVertical: 10 }}>
        <Text style={{ textAlign: 'center' }}>Rellenar con datos de prueba</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <Button title="Enviar solicitud" onPress={handleRequest} />
      </View>
    </ScrollView>
  );
}