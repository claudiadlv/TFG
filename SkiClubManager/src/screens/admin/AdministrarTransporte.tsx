import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  ScrollView, 
  TextInput 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../../config';

type Viaje = { 
  id: string; 
  destino: string; 
  fecha_salida: string; 
  plazas_totales: number; 
  plazas_disponibles: number;
  estado: 'abierto' | 'cerrado' | 'completado';
  categoria?: string;
  hora_salida_furgoneta?: string;
};

type Pasajero = {
  nombre: string;
  categoria: string;
};

type ActiveTab = 'Próximos' | 'Pasados';

const NOMBRES_MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export default function AdministrarTransporteAdmin() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Próximos');
  
  const [modalVisible, setModalVisible] = useState(false);
  const [pasajerosViaje, setPasajerosViaje] = useState<Pasajero[]>([]);
  const [cargandoPasajeros, setCargandoPasajeros] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cargarViajes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { 
        setViajes([]); 
        setLoading(false);
        return; 
      }
      
      const res = await fetch(`${API_URL}/transporte/admin`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const payload: Viaje[] = await res.json();
      setViajes(payload || []);
    } catch (e: any) {
      console.error('Error cargando viajes de transporte (Admin):', e);
      setError('No se pudieron cargar los datos de transporte del club.');
      setViajes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    cargarViajes(); 
  }, [cargarViajes]);

  useEffect(() => {
    setBusqueda('');
  }, [activeTab]);

  // Filtrado avanzado de furgonetas
  const viajesFiltrados = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyTime = hoy.getTime();
    
    let filtrados = viajes.filter(viaje => {
      if (!viaje.fecha_salida) return false;
      
      const soloFechaStr = viaje.fecha_salida.includes('T') 
        ? viaje.fecha_salida.split('T')[0] 
        : viaje.fecha_salida.split(' ')[0];
        
      const fechaViajeObj = new Date(soloFechaStr);
      fechaViajeObj.setHours(0, 0, 0, 0);
      const fechaViaje = fechaViajeObj.getTime();

      if (activeTab === 'Próximos') return fechaViaje >= hoyTime;
      return fechaViaje < hoyTime;
    });

    if (busqueda.trim() !== '') {
      const query = busqueda.toLowerCase().trim();
      
      filtrados = filtrados.filter(viaje => {
        const destinoOk = viaje.destino && viaje.destino.toLowerCase().includes(query);
        const fObj = new Date(viaje.fecha_salida);
        const nombreMesViaje = NOMBRES_MESES[fObj.getMonth()];
        const mesOk = nombreMesViaje.includes(query);
        const categoriaOk = viaje.categoria && viaje.categoria.toLowerCase().includes(query);
        
        return destinoOk || mesOk || categoriaOk;
      });
    }

    return filtrados.sort((a, b) => {
      const timeA = new Date(a.fecha_salida.includes('T') ? a.fecha_salida.split('T')[0] : a.fecha_salida.split(' ')[0]).getTime();
      const timeB = new Date(b.fecha_salida.includes('T') ? b.fecha_salida.split('T')[0] : b.fecha_salida.split(' ')[0]).getTime();
      return activeTab === 'Próximos' ? timeA - timeB : timeB - timeA;
    });
  }, [viajes, activeTab, busqueda]);

  const handleVerPasajeros = async (viajeId: string) => {
    setModalVisible(true);
    setCargandoPasajeros(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/transporte/admin/${viajeId}/pasajeros`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPasajerosViaje(data);
      }
    } catch (error) {
      console.error("Error obteniendo pasajeros del bus (Admin):", error);
    } finally {
      setCargandoPasajeros(false);
    }
  };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#0D47A1" /></View>;

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={[styles.actionButton, { marginTop: 15, paddingHorizontal: 20 }]} onPress={cargarViajes}>
          <Text style={styles.actionButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Gestión de Furgonetas</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Próximos' && styles.activeTab]} onPress={() => setActiveTab('Próximos')}>
          <Text style={[styles.tabText, activeTab === 'Próximos' && styles.activeTabText]}>Próximos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Pasados' && styles.activeTab]} onPress={() => setActiveTab('Pasados')}>
          <Text style={[styles.tabText, activeTab === 'Pasados' && styles.activeTabText]}>Pasados</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search-outline" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por mes..."
          placeholderTextColor="#888"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Icon name="close-circle" size={18} color="#888" style={{ paddingHorizontal: 5 }} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F7F9' }}>
      <FlatList
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        data={viajesFiltrados}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View>
            <Text style={styles.noDataText}>
              {busqueda ? 'No hay resultados que coincidan con tu búsqueda.' : 'No hay furgonetas programadas globales en el sistema.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const ocupadas = item.plazas_totales - item.plazas_disponibles;
          const porcentajeOcupacion = item.plazas_totales > 0 ? (ocupadas / item.plazas_totales) * 100 : 0;
          const isFull = item.plazas_disponibles === 0;

          const soloFechaStr = item.fecha_salida.includes('T') ? item.fecha_salida.split('T')[0] : item.fecha_salida.split(' ')[0];
          const partes = soloFechaStr.split('-');
          let fechaFormateada = item.fecha_salida;
          
          if (partes.length === 3) {
            const dia = parseInt(partes[2], 10).toString().padStart(2, '0');
            const mesesEspanyol = [
              'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
              'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
            ];
            const mes = mesesEspanyol[parseInt(partes[1], 10) - 1];
            fechaFormateada = `${dia} de ${mes}`;
          }

          return (
            <View style={styles.cardRow}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fechaText}>📅 {fechaFormateada}</Text>
                  {item.hora_salida_furgoneta ? (
                    <Text style={[styles.fechaText, { marginTop: 4, color: '#1E3A8A', fontWeight: 'bold' }]}>
                      🕒 Salida: {item.hora_salida_furgoneta.slice(0, 5)} h
                    </Text>
                  ) : null}
                  {item.categoria ? (
                    <Text style={styles.categoriaText}>🏷️ Cat: {item.categoria}</Text>
                  ) : null}
                </View>

                <View style={[styles.badgeEstado, isFull ? styles.badgeLleno : styles.badgeDisponible]}>
                  <Text style={[styles.badgeText, { color: isFull ? '#D32F2F' : '#15803D' }]}>
                    {isFull ? 'Lleno' : `${item.plazas_disponibles} libres`}
                  </Text>
                </View>
              </View>

              <View style={styles.capacityContainer}>
                <View style={styles.capacityLabels}>
                  <Text style={styles.capacityText}>Ocupación Total: {ocupadas}/{item.plazas_totales} plazas</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[
                    styles.progressBarFill, 
                    { width: `${porcentajeOcupacion}%`, backgroundColor: isFull ? '#D32F2F' : '#1E88E5' }
                  ]} />
                </View>
              </View>

              <TouchableOpacity style={styles.actionButton} onPress={() => handleVerPasajeros(item.id)}>
                <Text style={styles.actionButtonText}>Ver Pasajeros</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.content}>
            <Text style={modalStyles.titulo}>Pasajeros Totales</Text>
            {cargandoPasajeros ? (
              <ActivityIndicator size="large" color="#0D47A1" style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={{ maxHeight: 300, marginVertical: 15 }}>
                {pasajerosViaje.map((p, i) => (
                  <View key={i} style={modalStyles.filaPasajero}>
                    <Text style={modalStyles.nombrePasajero}>👤 {p.nombre}</Text>
                    <Text style={modalStyles.catPasajero}>{p.categoria || 'Todas'}</Text>
                  </View>
                ))}
                {pasajerosViaje.length === 0 && (
                  <Text style={{ textAlign: 'center', color: '#888', marginVertical: 20, fontStyle: 'italic' }}>
                    No hay ningún deportista apuntado en esta furgoneta.
                  </Text>
                )}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={[modalStyles.botonCerrar, { backgroundColor: '#0D47A1' }]}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>CERRAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- ESTILOS DE DISEÑO UNIFICADO ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 50 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', textAlign: 'center', fontWeight: 'bold' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 14 },
  header: { fontSize: 22, fontWeight: '700', color: '#1E3A8A', textAlign: 'center', flex: 1 },
  noDataText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16, fontStyle: 'italic' },
  tabContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#E2E8F0', borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontWeight: '600', color: '#64748B' },
  activeTabText: { color: '#0D47A1' },
  cardRow: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  destinoName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  fechaText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  categoriaText: { fontSize: 13, color: '#475569', backgroundColor: '#F1F5F9', padding: 6, borderRadius: 6, marginVertical: 6, alignSelf: 'flex-start' },
  badgeEstado: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeDisponible: { backgroundColor: '#DCFCE7' },
  badgeLleno: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  capacityContainer: { marginBottom: 12, marginTop: 6 },
  capacityLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  capacityText: { fontSize: 13, color: '#475569' },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  actionButton: { backgroundColor: '#F0F4F8', paddingVertical: 10, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#D0D9E0', marginTop: 4 },
  actionButtonText: { color: '#0D47A1', fontWeight: '600', fontSize: 14 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 10, marginBottom: 5, height: 44, elevation: 1 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', height: '100%', paddingVertical: 0 }
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 10 },
  titulo: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 5 },
  filaPasajero: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  nombrePasajero: { fontSize: 15, color: '#374151', fontWeight: '500' },
  catPasajero: { fontSize: 12, color: '#0D47A1', fontWeight: '700', backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  botonCerrar: { marginTop: 20, padding: 12, borderRadius: 10, alignItems: 'center' }
});