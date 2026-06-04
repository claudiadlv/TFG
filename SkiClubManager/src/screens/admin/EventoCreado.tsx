import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EntrenadorStackParamList } from '../../navigation/types/types';

const EventoCreado = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EntrenadorStackParamList>>();

  const volverAlInicio = () => {
    navigation.navigate('InicioEntrenador', {
      screen: 'HomeEntrenador',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={volverAlInicio} activeOpacity={0.8}>
      <Text style={styles.text}>Evento creado</Text>
      <Ionicons name="checkmark-circle" size={100} color="#003366" />
      <Text style={styles.instruccion}>Toca la pantalla para volver</Text>
    </TouchableOpacity>
  );
};

export default EventoCreado;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#003366',
  },
  instruccion: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
