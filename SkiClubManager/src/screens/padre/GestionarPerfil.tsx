import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { API_URL } from '../../config';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../../styles/GestionarPerfilPadre.styles';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PadreStackParamList } from '../../navigation/types/types';

export default function GestionarPerfilScreen() {
  const [hijos, setHijos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { accessToken } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<PadreStackParamList>>();
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchHijos = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/deportista/mis_hijos`, accessToken);
        const data = await response.json();
        setHijos(data);
      } catch (error) {
        console.error('Error al obtener datos de los hijos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken && isFocused) {
      setLoading(true);
      fetchHijos();
    }
  }, [accessToken, isFocused]);

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4A56E2" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>👨‍👩‍👧‍👦 Hijos/as</Text>

      {hijos.length === 0 ? (
        <Text style={styles.noData}>No hay hijos registrados.</Text>
      ) : (
        hijos.map((hijo, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.row}>
              <Icon name="person" size={20} color="#333" style={styles.icon} />
              <Text style={styles.name}>{hijo.nombre}</Text>
            </View>
            <View style={styles.row}>
              <Icon name="calendar" size={16} color="#444" style={styles.icon} />
              <Text style={styles.text}>
                Fecha de nacimiento: {formatearFecha(hijo.fecha_nacimiento)}
              </Text>
            </View>
            <View style={styles.row}>
              <Icon name="pricetag" size={16} color="#444" style={styles.icon} />
              <Text style={styles.text}>
                Categoría: {hijo.categoria ?? 'Sin categoría asignada'}
              </Text>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AnadirHijo')}>
        <Icon name="add" size={20} color="white" />
        <Text style={styles.addButtonText}>Añadir hijo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
