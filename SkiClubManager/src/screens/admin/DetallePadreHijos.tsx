import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types/types';
import { API_URL } from '../../config';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

// 🆕 Importamos el componente del calendario nativo
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = NativeStackScreenProps<AdminStackParamList, 'DetallePadreHijos'>;

export default function DetallePadreHijos({ route, navigation }: Props) {
  const { deportista } = route.params || {};

  const [nombre, setNombre] = useState(deportista?.nombre_deportista || '');
  const [apellidos, setApellidos] = useState(deportista?.apellidos_deportista || '');
  
  // 📆 La fecha para el estado interno del input (Texto: YYYY-MM-DD)
  const [fechaNacimiento, setFechaNacimiento] = useState(
    deportista?.fecha_nacimiento ? deportista.fecha_nacimiento.split('T')[0] : ''
  );

  // 🆕 Estado para controlar cuándo se muestra el calendario flotante
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!deportista) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#666', fontSize: 16 }}>No se recibieron los datos del expediente.</Text>
      </View>
    );
  }

  // 🆕 Función que captura el cambio de fecha en el calendario
  const onChangeFecha = (event: any, selectedDate?: Date) => {
    setShowCalendar(false); 

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      
      setFechaNacimiento(`${year}-${month}-${day}`);
    }
  };

  // 📝 1. GUARDAR CAMBIOS (MÉTODO PUT)
  const handleGuardarCambios = async () => {
    if (!nombre.trim() || !apellidos.trim() || !fechaNacimiento.trim()) {
      Alert.alert('Atención', 'Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/deportista/actualizar/${deportista.deportista_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellidos, fecha_nacimiento: fechaNacimiento }),
      });

      if (response.ok) {
        Alert.alert('¡Éxito!', 'Expediente actualizado correctamente.', [
          { text: 'Genial', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'No se pudo actualizar el expediente.');
      }
    } catch (error) {
      Alert.alert('Error de red', 'No hay conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ 2. ELIMINAR DEPORTISTA CON ALERTA DE CONFIRMACIÓN (MÉTODO DELETE)
  const handleEliminarDeportista = () => {
    Alert.alert(
      '¿Eliminar expediente?',
      `¿Estás seguro de que deseas dar de baja definitiva a ${nombre} ${apellidos}? Se eliminará su historial del club y esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_URL}/deportista/eliminar/${deportista.deportista_id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
              });

              if (response.ok) {
                Alert.alert('Eliminado', 'El deportista ha sido dado de baja correctamente.', [
                  { text: 'Entendido', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Error', 'No se pudo eliminar el expediente de la base de datos.');
              }
            } catch (error) {
              Alert.alert('Error de red', 'No se pudo conectar con el servidor.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          
          {/* Ficha editable del esquiador */}
          <View style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#EEF0F2' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' }}>Datos del Esquiador</Text>
            
            <Text style={{ fontWeight: '600', color: '#555', marginBottom: 4 }}>Nombre</Text>
            <TextInput style={{ backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, marginBottom: 12, color: '#333' }} value={nombre} onChangeText={setNombre} />

            <Text style={{ fontWeight: '600', color: '#555', marginBottom: 4 }}>Apellidos</Text>
            <TextInput style={{ backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, marginBottom: 12, color: '#333' }} value={apellidos} onChangeText={setApellidos} />

            <Text style={{ fontWeight: '600', color: '#555', marginBottom: 4 }}>Fecha de Nacimiento</Text>
            
            <TouchableOpacity 
              style={{ 
                backgroundColor: '#F8F9FA', 
                borderWidth: 1, 
                borderColor: '#DDD', 
                borderRadius: 8, 
                padding: 12, 
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }} 
              onPress={() => setShowCalendar(true)}
            >
              <Text style={{ color: fechaNacimiento ? '#333' : '#999', fontSize: 15 }}>
                {fechaNacimiento || 'Selecciona una fecha...'}
              </Text>
              <Icon name="calendar-outline" size={20} color="#4A56E2" />
            </TouchableOpacity>

            {showCalendar && (
              <DateTimePicker
                value={fechaNacimiento ? new Date(fechaNacimiento) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onChangeFecha}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Ficha informativa del Tutor Legal */}
          <View style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 25, borderWidth: 1, borderColor: '#EEF0F2' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' }}>Tutor Legal Vinculado</Text>
            
            <Text style={{ fontSize: 12, color: '#888' }}>Nombre Completo</Text>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 8 }}>
              {deportista.nombre_tutor} {deportista.apellidos_tutor || ''}
            </Text>
            
            <Text style={{ fontSize: 12, color: '#888' }}>Correo</Text>
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#333' }}>{deportista.correo_tutor}</Text>
          </View>

          {/* 🟦 Botón: Guardar Cambios */}
          <TouchableOpacity 
            style={{ backgroundColor: '#4A56E2', borderRadius: 8, padding: 15, alignItems: 'center', marginBottom: 12 }} 
            onPress={handleGuardarCambios} 
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Guardar Cambios</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ 
              backgroundColor: '#FFF', 
              borderWidth: 1, 
              borderColor: '#EF4444', 
              borderRadius: 8, 
              padding: 15, 
              alignItems: 'center', 
              flexDirection: 'row', 
              justifyContent: 'center' 
            }} 
            onPress={handleEliminarDeportista} 
            disabled={loading}
          >
            <Icon name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 16 }}>Eliminar Deportista</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}