import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { API_URL } from '../../config';
import styles from '../../styles/AdministrarUsuarios.styles';

type Solicitud = {
  id: number;
  nombre_tutor: string;
  apellidos_tutor: string;
  correo_tutor: string;
  nombre_hijo: string;
  apellidos_hijo: string;
  fecha_nacimiento_hijo: string;
  categoria: string;
};

export default function AdministrarUsuarios() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarSolicitudes = () => {
    fetch(`${API_URL}/solicitudes-registro`)
      .then((res) => res.json())
      .then((data) => {
        console.log('[ADMIN] Datos recibidos del backend:', data);
        setSolicitudes(data);
        setCargando(false);
      })
      .catch((err) => {
        console.error('[ADMIN] error al cargar solicitudes:', err);
        Alert.alert('Error', 'No se pudieron cargar las solicitudes');
        setCargando(false);
      });
  };

  const aceptarSolicitud = async (id: number) => {
    const url = `${API_URL}/solicitudes-registro/${id}/aceptar`;
    console.log('[ADMIN] aceptando solicitud a:', url);

    try {
      const res = await fetch(url, { method: 'POST' });
      const text = await res.text();

      if (!res.ok) {
        console.error('[ADMIN] Error al aprobar:', res.status, text);
        Alert.alert('Error', `No se pudo aprobar la solicitud\n(${res.status})`);
        return;
      }

      Alert.alert('Usuario aprobado correctamente');
      cargarSolicitudes();
    } catch (error) {
      console.error('[ADMIN] Error de red al aceptar:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  const rechazarSolicitud = async (id: number) => {
    const url = `${API_URL}/solicitudes-registro/${id}/rechazar`;
    console.log('[ADMIN] rechazando solicitud a:', url);

    try {
      const res = await fetch(url, { method: 'POST' });

      if (!res.ok) {
        console.error('[ADMIN] Error al rechazar:', res.status);
        Alert.alert('Error', `No se pudo rechazar la solicitud\n(${res.status})`);
        return;
      }

      Alert.alert('Solicitud rechazada');
      cargarSolicitudes();
    } catch (error) {
      console.error('[ADMIN] Error de red al rechazar:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  const confirmarAceptar = (id: number) => {
    Alert.alert(
      'Confirmar aceptación',
      '¿Estás seguro de que deseas aceptar esta solicitud?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aceptar', onPress: () => aceptarSolicitud(id) },
      ]
    );
  };

  const confirmarRechazar = (id: number) => {
    Alert.alert(
      'Confirmar rechazo',
      '¿Estás seguro de que deseas rechazar esta solicitud?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Rechazar', onPress: () => rechazarSolicitud(id) },
      ]
    );
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  if (cargando) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  return (
    <FlatList
      data={solicitudes}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.container}
      ListEmptyComponent={<Text style={styles.vacio}>No hay solicitudes pendientes</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.titulo}>{item.nombre_tutor} {item.apellidos_tutor}</Text>
          <Text>Correo: {item.correo_tutor}</Text>
          <Text>Hijo: {item.nombre_hijo} {item.apellidos_hijo}</Text>
          <Text>Categoria: {item.categoria}</Text>

          <View style={styles.botones}>
            <TouchableOpacity
              style={[styles.boton, styles.botonAceptar]}
              onPress={() => confirmarAceptar(item.id)}
            >
              <Text style={styles.textoBoton}>ACEPTAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.boton, styles.botonRechazar]}
              onPress={() => confirmarRechazar(item.id)}
            >
              <Text style={styles.textoBoton}>RECHAZAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}