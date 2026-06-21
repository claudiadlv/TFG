import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons'; // 🔥 Importante para el icono del reloj
import { API_URL } from '../../config';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { PadreStackParamList } from '../../navigation/types/types';
import styles from '../../styles/DetalleEntrenamiento.styles';

import imagenFisico from '../../img/gym.png';
import imagenPista from '../../img/juandelcampo.jpg';
import imagenCarrera from '../../img/carrera.jpg';

//Tipos
type Evento = { 
  id: string; 
  tipo: string; 
  fecha: string; 
  hora: string; 
  categoria: string | string[]; 
  disciplina?: string;
  viaje_id?: number | null;               
  hora_salida_furgoneta?: string | null; 
};

type Hijo = { id: string; nombre: string; categoria: string; enFurgoneta: boolean };

const getImagenFondo = (tipo: string) => {
  switch (tipo) {
    case 'Físico': return imagenFisico;
    case 'Pista':  return imagenPista;
    case 'Carrera':return imagenCarrera;
    default:       return imagenFisico;
  }
};

const getTituloBonito = (tipo: string) => {
  switch (tipo) {
    case 'Físico': return 'Sesión de entrenamiento físico';
    case 'Pista':  return 'Entrenamiento en pista';
    case 'Carrera':return 'Carrera';
    default:       return tipo;
  }
};

const getChipBg = (tipo: string) => {
  switch (tipo) {
    case 'Físico': return 'rgba(61,190,96,0.92)';
    case 'Pista':  return 'rgba(30,136,229,0.92)';
    case 'Carrera':return 'rgba(183,28,28,0.92)';
    default:       return 'rgba(33,33,33,0.92)';
  }
};

const formatFechaLinda = (fechaStr: string) => {
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return fechaStr; }
};

export default function DetalleEventoPadreDesapuntar() {
  const route = useRoute<RouteProp<{params: {entrenamiento: Evento}}, 'params'>>();
  const { entrenamiento: evento } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<PadreStackParamList>>();

  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [hijosSeleccionados, setHijosSeleccionados] = useState<string[]>([]);
  const [enFurgoneta, setEnFurgoneta] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [haCambiado, setHaCambiado] = useState(false);

  const tieneTransporte = evento?.viaje_id !== null && evento?.viaje_id !== undefined;

  const categoriasAMostrar = Array.isArray(evento.categoria) 
    ? evento.categoria.join(', ') 
    : evento.categoria;

  const cargarHijos = useCallback(async () => {
    try {
      setCargando(true);
      const token = await AsyncStorage.getItem('accessToken');

      const resHijos = await fetchWithAuth(`${API_URL}/deportista/mis_hijos`, token);
      const misHijos = await resHijos.json();

      const resIns = await fetchWithAuth(`${API_URL}/eventos/${evento.id}/inscritos`, token);
      const inscritos = await resIns.json();

      const apuntados = misHijos.map((h: any) => {
        const ins = inscritos.find((i: any) => String(i.id) === String(h.id));
        if (ins) {
          return { ...h, estaApuntado: true, enFurgoneta: ins.enFurgoneta === 1 };
        }
        return null;
      }).filter(Boolean);

      setHijos(apuntados);
    } catch (e) {
      console.error(e);
    } fileStatus: {
      setCargando(false);
    }
  }, [evento.id]);

  useEffect(() => { cargarHijos(); }, [cargarHijos]);

  useEffect(() => {
    if (hijosSeleccionados.length === 1) {
      const hijo = hijos.find(h => String(h.id) === hijosSeleccionados[0]);
      setHaCambiado(hijo?.enFurgoneta !== enFurgoneta);
    } else {
      setHaCambiado(hijosSeleccionados.length > 0);
    }
  }, [enFurgoneta, hijosSeleccionados, hijos]);

  const toggleHijo = (id: string) => {
    setHijosSeleccionados(prev => {
      const nuevaSeleccion = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      if (nuevaSeleccion.length === 1) {
        const hijo = hijos.find(h => String(h.id) === nuevaSeleccion[0]);
        if (hijo) setEnFurgoneta(hijo.enFurgoneta);
      }
      return nuevaSeleccion;
    });
  };

  const actualizarTransporte = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token || hijosSeleccionados.length === 0) return;
    try {
      setCargando(true);
      const promesas = hijosSeleccionados.map(idHijo => 
        fetchWithAuth(`${API_URL}/eventos/${evento.id}/transporte-hijo`, token, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hijoId: idHijo, enFurgoneta: enFurgoneta }) 
        })
      );
      const respuestas = await Promise.all(promesas);
      if (respuestas.every(res => res.ok)) {
        setHaCambiado(false);
        Alert.alert('¡Éxito!', `Se ha actualizado el transporte.`, [
          { text: 'OK', onPress: () => navigation.navigate('InicioPadre', { screen: 'INICIO' } as any) }
        ]);
      } else {
        Alert.alert('Atención', 'No se pudo actualizar el transporte.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const handleDesapuntar = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token || hijosSeleccionados.length === 0) return;

    Alert.alert('Confirmar', `¿Quieres eliminar la inscripción?`, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Eliminar', 
        style: 'destructive', 
        onPress: async () => {
          try {
            setCargando(true);
            const promesas = hijosSeleccionados.map(id => 
              fetchWithAuth(`${API_URL}/eventos/${evento.id}/desapuntar?hijoId=${id}`, token, { method: 'DELETE' })
            );
            const respuestas = await Promise.all(promesas);
            if (respuestas.every(r => r.ok)) {
              navigation.navigate('InicioPadre', { screen: 'INICIO' } as any);
            } else {
              Alert.alert('Error', 'No se pudo completar.');
              cargarHijos();
            }
          } catch (error) {
            console.error(error);
          } finally {
            setCargando(false);
          }
        }
      }
    ]);
  };

  if (cargando) return <ActivityIndicator size="large" style={{ marginTop: 40 }} color="#0D47A1" />;

  const hijoActual = hijos.find(h => String(h.id) === hijosSeleccionados[0]);

  const horaFurgonetaLimpia = evento?.hora_salida_furgoneta 
    ? String(evento.hora_salida_furgoneta).slice(0, 5) 
    : '07:30';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ImageBackground source={getImagenFondo(evento.tipo)} style={styles.header}>
        <View style={headerStyles.overlay}>
          <Text style={[headerStyles.pill, { backgroundColor: getChipBg(evento.tipo) }]}>
            {getTituloBonito(evento.tipo)}
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.info}>
        <Text style={styles.label}>Fecha: <Text style={styles.valor}>{formatFechaLinda(evento.fecha)}</Text></Text>
        <Text style={styles.label}>Hora Entrenamiento: <Text style={styles.valor}>{evento.hora.slice(0, 5)} h</Text></Text>
        <Text style={styles.label}>Categoría: <Text style={styles.valor}>{categoriasAMostrar}</Text></Text>
        {evento.disciplina && (
          <Text style={styles.label}>Disciplina: <Text style={styles.valor}>{evento.disciplina}</Text></Text>
        )}
      </View>

      {tieneTransporte && (
        <View style={customStyles.citacionBox}>
          <Icon name="time-outline" size={20} color="#0D47A1" style={{ marginRight: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={customStyles.citacionLabel}>
              Citación furgoneta: <Text style={customStyles.citacionValor}>{horaFurgonetaLimpia} h</Text>
            </Text>
          </View>
        </View>
      )}

      <View style={multiSelectStyles.section}>
        <Text style={multiSelectStyles.title}>Gestionar inscripción de:</Text>
        <View style={multiSelectStyles.list}>
          {hijos.map((h) => {
            const isSel = hijosSeleccionados.includes(String(h.id));
            return (
              <TouchableOpacity key={h.id} onPress={() => toggleHijo(String(h.id))} style={[multiSelectStyles.card, isSel && multiSelectStyles.cardSelected]}>
                <Text style={[multiSelectStyles.name, isSel && multiSelectStyles.nameSelected]}>
                  {h.nombre} {h.enFurgoneta ? '🚐' : ''}
                </Text>
                {isSel && <Text style={multiSelectStyles.check}> ✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {hijosSeleccionados.length > 0 && (
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ 
            backgroundColor: !!enFurgoneta ? '#F0F9FF' : '#FEF2F2', 
            padding: 12, 
            borderRadius: 10, 
            marginTop: 5,
            marginBottom: 15,
            borderWidth: 1.5,
            borderColor: !!enFurgoneta ? '#7DD3FC' : '#FCA5A5',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 28, marginRight: 12 }}>🚐</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: !!enFurgoneta ? '#0369A1' : '#991B1B', fontSize: 14 }}>
                Logística de Transporte
              </Text>
              <Text style={{ color: !!enFurgoneta ? '#0C4A6E' : '#B91C1C', fontSize: 13 }}>
                {!!enFurgoneta 
                  ? `Plaza asignada para ${hijoActual?.nombre || 'el deportista'}` 
                  : `Sin plaza de transporte para ${hijoActual?.nombre || 'el deportista'}`}
              </Text>
            </View>
          </View>

          <View style={transportStyles.container}>
            <View style={transportStyles.textContainer}>
              <Text style={transportStyles.label}>Solicitar Furgoneta</Text>
              <Text style={transportStyles.subLabel}>
                {enFurgoneta ? "Inscrito en el transporte." : "Irá por medios propios."}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#90CAF9" }}
              thumbColor={enFurgoneta ? "#0D47A1" : "#f4f3f4"}
              onValueChange={setEnFurgoneta}
              value={enFurgoneta}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: haCambiado ? '#3DBE60' : '#BDBDBD' }]} 
            onPress={actualizarTransporte}
            disabled={!haCambiado}
          >
            <Text style={styles.textoBoton}>GUARDAR CAMBIOS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.botonRojo]} onPress={handleDesapuntar}>
            <Text style={styles.textoBoton}>CANCELAR INSCRIPCIÓN</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

//Estilos
const customStyles = StyleSheet.create({
  citacionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD', 
    borderColor: '#90CAF9',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 5,
    gap: 8,
    elevation: 1,
  },
  citacionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D47A1',
  },
  citacionValor: {
    fontWeight: '600',
    color: '#212121',
  },
});

const headerStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  pill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, color: '#fff', fontWeight: '700', fontSize: 18, elevation: 3 },
});

const multiSelectStyles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginTop: 15, marginBottom: 10 },
  title: { fontSize: 13, fontWeight: '700', color: '#0D47A1', marginBottom: 10 },
  list: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#B0BEC5', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, marginRight: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  cardSelected: { backgroundColor: '#0D47A1', borderColor: '#0D47A1' },
  name: { color: '#37474F', fontWeight: '600' },
  nameSelected: { color: '#fff' },
  check: { color: '#fff', fontWeight: 'bold' },
});

const transportStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, padding: 12, backgroundColor: '#F5F5F5', borderRadius: 10 },
  textContainer: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: '#37474F' },
  subLabel: { fontSize: 12, color: '#78909C' },
});