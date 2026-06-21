import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types/types';
import Icon from 'react-native-vector-icons/Ionicons'; // 🔥 Importado exclusivamente para el icono del reloj
import styles from '../../styles/DetalleEntrenamiento.styles';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';
import { Modal } from 'react-native'; 

// IMÁGENES
import imagenFisico from '../../img/gym.png';
import imagenPista from '../../img/juandelcampo.jpg';
import imagenCarrera from '../../img/carrera.jpg';

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

type Props = {
  route: RouteProp<AdminStackParamList, 'DetalleEntrenamiento'>;
};

export default function DetalleEntrenamiento({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const { accessToken } = useAuth();
  
  const [entrenamiento, setEntrenamiento] = useState<any>(route.params.entrenamiento);
  
  // --- ESTADOS ---
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [cargandoInscritos, setCargandoInscritos] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [pasajerosViaje, setPasajerosViaje] = useState<any[]>([]);
  const [cargandoPasajeros, setCargandoPasajeros] = useState(false);
  const [modalAsistenciaVisible, setModalAsistenciaVisible] = useState(false);

  useEffect(() => {
    const cargarDatosFrescos = async () => {
      if (!accessToken) return;
      try {
        // 1. Cargamos la asistencia (Inscritos al evento)
        const resAsistencia = await fetch(`${API_URL}/eventos/${entrenamiento.id}/inscritos`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (resAsistencia.ok) setInscritos(await resAsistencia.json());

        // 2. Apuntamos al endpoint global para refrescar datos de la furgoneta
        const resEventos = await fetch(`${API_URL}/eventos/todos`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (resEventos.ok) {
          const listaEventos = await resEventos.json();
          const eventoActualizado = listaEventos.find((e: any) => e.id === entrenamiento.id);
          if (eventoActualizado) {
            setEntrenamiento(eventoActualizado);
          }
        }
      } catch (error) {
        console.error("Error cargando datos en detalle:", error);
      } finally {
        setCargandoInscritos(false);
      }
    };
    cargarDatosFrescos();
  }, [entrenamiento.id, accessToken]);

  const plazasTotales = Number(entrenamiento.plazas_totales || 0);
  const ocupadas = Number(entrenamiento.plazas_ocupadas || 0);
  const tieneTransporte = plazasTotales > 0;
  const estaLlenoReal = tieneTransporte && ocupadas >= plazasTotales;

  const fechaFormateada = new Date(entrenamiento.fecha).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  const horaFormateada = (entrenamiento.hora || '').slice(0, 5);

  const categoriasMostrar = Array.isArray(entrenamiento.categoria)
    ? entrenamiento.categoria.join(', ')
    : (() => {
        const c = String(entrenamiento.categoria ?? '');
        try {
          const parsed = JSON.parse(c);
          return Array.isArray(parsed) ? parsed.join(', ') : c;
        } catch { return c; }
      })();

  const verPasajerosFurgoneta = async () => {
    if (!entrenamiento.viaje_id) return;
    setCargandoPasajeros(true);
    setModalVisible(true);
    try {
      const response = await fetch(`${API_URL}/eventos/viaje/${entrenamiento.viaje_id}/pasajeros`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) setPasajerosViaje(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoPasajeros(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ImageBackground source={getImagenFondo(entrenamiento.tipo)} style={styles.header}>
        <View style={headerStyles.overlay}>
          <Text style={[headerStyles.pill, { backgroundColor: getChipBg(entrenamiento.tipo) }]}>
            {getTituloBonito(entrenamiento.tipo)}
          </Text>
        </View>
      </ImageBackground>

      <View style={[styles.info, { paddingBottom: 25 }]}>
        <Text style={styles.label}>Fecha: <Text style={styles.valor}>{fechaFormateada}</Text></Text>
        <Text style={styles.label}>Hora Entrenamiento: <Text style={styles.valor}>{horaFormateada} h</Text></Text>
        
        {entrenamiento.hora_salida_furgoneta ? (
          <View style={customStyles.citacionBox}>
            <Icon name="time-outline" size={20} color="#0D47A1" style={{ marginRight: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={customStyles.citacionLabel}>
                Citación furgoneta: <Text style={customStyles.citacionValor}>{entrenamiento.hora_salida_furgoneta.slice(0, 5)} h</Text>
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.label}>Categoría: <Text style={styles.valor}>{categoriasMostrar}</Text></Text>

        <TouchableOpacity onPress={() => setModalAsistenciaVisible(true)} style={cardStyles.botonInfo}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={cardStyles.titulo}>Asistencia Confirmada</Text>
            <Text style={cardStyles.subtitulo}>
              {cargandoInscritos ? '...' : `${inscritos.length} deportistas`}
            </Text>
          </View>
        </TouchableOpacity>

        {tieneTransporte && (
          <TouchableOpacity 
            onPress={verPasajerosFurgoneta}
            style={[cardStyles.botonInfo, cardStyles.bgAzul, estaLlenoReal && cardStyles.bgRojo]}
          >
            <Text style={{ fontSize: 24, marginRight: 12 }}>🚐</Text>
            <View style={{ flex: 1 }}>
              <Text style={[cardStyles.titulo, { color: estaLlenoReal ? '#991B1B' : '#0369A1' }]}>
                {estaLlenoReal ? 'Furgoneta Completa' : 'Logística de Furgoneta'}
              </Text>
              <Text style={[cardStyles.subtitulo, { color: estaLlenoReal ? '#B91C1C' : '#0C4A6E', marginTop: 2 }]}>
                {`${ocupadas} de ${plazasTotales} plazas ocupadas`}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={modalAsistenciaVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={modalStyles.titulo}>Deportistas Inscritos</Text>
            
            <ScrollView style={{ maxHeight: 300, marginVertical: 15 }}>
              {inscritos.map((p, i) => (
                <View key={i} style={modalStyles.filaPasajero}>
                  <Text style={modalStyles.nombrePasajero}>👤 {p.nombre}</Text>
                  {p.categoria ? (
                    <Text style={modalStyles.catPasajero}>
                      {String(p.categoria).replace(/[\[\]" ]/g, '')}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              onPress={() => setModalAsistenciaVisible(false)} 
              style={[modalStyles.botonCerrar, { backgroundColor: '#0369A1' }]}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
</Modal>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={modalStyles.titulo}>Pasajeros</Text>
            {cargandoPasajeros ? (
              <ActivityIndicator size="large" color="#0369A1" style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 300, marginVertical: 15 }}>
                {pasajerosViaje.map((p, i) => (
                  <View key={i} style={modalStyles.filaPasajero}>
                    <Text style={modalStyles.nombrePasajero}>👤 {p.nombre}</Text>
                    <Text style={modalStyles.catPasajero}>{p.categoria}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={[modalStyles.botonCerrar, {backgroundColor: '#0369A1'}]}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// --- HOJA DE ESTILOS ESTILIZADA ---
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
    marginTop: 10,
    marginBottom: 10,
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

const cardStyles = StyleSheet.create({
  botonInfo: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
  },
  bgAzul: { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC' },
  bgRojo: { backgroundColor: '#FEE2E2', borderColor: '#F87171' },
  titulo: { fontWeight: 'bold', color: '#374151', fontSize: 15 },
  subtitulo: { color: '#6B7280', fontSize: 13 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 10 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  filaPasajero: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  nombrePasajero: { fontSize: 15, color: '#374151' },
  catPasajero: { fontSize: 12, color: '#0369A1', fontWeight: '700', backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  botonCerrar: { marginTop: 20, padding: 12, borderRadius: 10, alignItems: 'center' }
});