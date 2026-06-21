import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../../config';

type Viaje = { 
  id: string; 
  destino: string;
  fecha_salida: string; 
  hora_salida_furgoneta?: string | null; 
  plazas_totales: number; 
  plazas_disponibles: number;
};

type Reserva = {
  viaje_id: number;
  deportista_id: number;
  nombre_deportista: string; 
};

type ActiveTab = 'Próximos' | 'Pasados';

const NOMBRES_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export default function TransportePadre() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Próximos');
  const [busqueda, setBusqueda] = useState('');

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/transporte/padre`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
      const data = await res.json();
      setViajes(data.viajes || []);
      setReservas(data.reservas || []);
    } catch (e) {
      console.error('❌ Error cargando transporte padre:', e);
      setError('No se pudieron cargar los horarios de la furgoneta.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  useEffect(() => {
    setBusqueda('');
  }, [activeTab]);

  const misHijos = useMemo(() => {
    const mapa = new Map<number, string>();
    reservas.forEach(r => {
      if (r.deportista_id && r.nombre_deportista) {
        mapa.set(Number(r.deportista_id), r.nombre_deportista);
      }
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [reservas]);

  const viajesFiltrados = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const hoyTime = hoy.getTime();
    
    let vinculados = viajes.filter(v => 
      reservas.some(r => String(r.viaje_id) === String(v.id))
    );

    let filtrados = vinculados.filter(viaje => {
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
        const destinoOk = viaje.destino.toLowerCase().includes(query);
         
        const fObj = new Date(viaje.fecha_salida);
        const nombreMesViaje = NOMBRES_MESES[fObj.getMonth()] || '';
        const mesOk = nombreMesViaje.includes(query);
        
        return destinoOk || mesOk;
      });
    }

    return filtrados.sort((a, b) => {
      const timeA = new Date(a.fecha_salida.includes('T') ? a.fecha_salida.split('T')[0] : a.fecha_salida.split(' ')[0]).getTime();
      const timeB = new Date(b.fecha_salida.includes('T') ? b.fecha_salida.split('T')[0] : b.fecha_salida.split(' ')[0]).getTime();
      return activeTab === 'Próximos' ? timeA - timeB : timeB - timeA;
    });
  }, [viajes, reservas, activeTab, busqueda]);

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#0D47A1" /></View>;
  if (error) return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <Text style={styles.headerTitle}>Transporte del Club</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Próximos' && styles.activeTab]} onPress={() => setActiveTab('Próximos')}>
            <Text style={[styles.tabText, activeTab === 'Próximos' && styles.activeTabText]}>Próximos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'Pasados' && styles.activeTab]} onPress={() => setActiveTab('Pasados')}>
            <Text style={[styles.tabText, activeTab === 'Pasados' && styles.activeTabText]}>Historial</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Icon name="search-outline" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por dia o mes..."
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

      <FlatList
        contentContainerStyle={styles.contentContainer}
        data={viajesFiltrados}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bus-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {busqueda ? 'No hay resultados que coincidan con tu búsqueda.' : 'No hay transportes programados.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const ocupadas = item.plazas_totales - item.plazas_disponibles;
          const porcentaje = item.plazas_totales > 0 ? (ocupadas / item.plazas_totales) * 100 : 0;
          const isFull = item.plazas_disponibles === 0;

          const soloFechaStr = item.fecha_salida.includes('T') ? item.fecha_salida.split('T')[0] : item.fecha_salida.split(' ')[0];
          const partes = soloFechaStr.split('-');
          let fechaFormateada = item.fecha_salida;
          
          if (partes.length === 3) {
            const dia = parseInt(partes[2], 10).toString().padStart(2, '0');
            const mes = NOMBRES_MESES[parseInt(partes[1], 10) - 1];
            fechaFormateada = `${dia} de ${mes}`;
          }

          const horaFormateada = item.hora_salida_furgoneta 
            ? item.hora_salida_furgoneta.slice(0, 5) 
            : '--:--';

          return (
            <View style={styles.cardRow}>
              <View style={styles.detailsBody}>
                <View style={styles.detailLine}>
                  <Text style={{ fontSize: 13, marginRight: 6 }}>📅</Text>
                  <Text style={styles.detailText}>{fechaFormateada}</Text>
                </View>
                <View style={styles.detailLine}>
                  <Text style={{ fontSize: 13, marginRight: 6 }}>🕒</Text>
                  <Text style={styles.detailText}>Salida: {horaFormateada} h</Text>
                </View>
              </View>

              <View style={styles.capacityContainer}>
                <Text style={styles.capacityText}>Ocupación: {ocupadas}/{item.plazas_totales} plazas</Text>
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${porcentaje}%`, backgroundColor: isFull ? '#D32F2F' : '#1E88E5' }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.hijosSection}>
                <View style={styles.hijosContainer}>
                  {[...misHijos]
                    .sort((a, b) => {
                      const aApuntado = reservas.some(r => 
                        String(r.viaje_id) === String(item.id) && Number(r.deportista_id) === Number(a.id)
                      );
                      const bApuntado = reservas.some(r => 
                        String(r.viaje_id) === String(item.id) && Number(r.deportista_id) === Number(b.id)
                      );
                      
                      return (bApuntado ? 1 : 0) - (aApuntado ? 1 : 0);
                    })
                    .map(hijo => {
                      const registradoEnEsteViaje = reservas.some(r => 
                        String(r.viaje_id) === String(item.id) && Number(r.deportista_id) === Number(hijo.id)
                      );
                      return (
                        <View 
                          key={hijo.id} 
                          style={[
                            styles.hijoBadge, 
                            registradoEnEsteViaje ? styles.badgeApuntado : styles.badgeNoApuntado
                          ]}
                        >
                          <Text style={[styles.hijoTexto, registradoEnEsteViaje ? styles.textoApuntado : styles.textoNoApuntado]}>
                            {registradoEnEsteViaje ? '✅ ' : '❌ '}
                            {hijo.nombre}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

//Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  fixedHeader: { paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#F3F4F6' },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 6 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  errorText: { color: 'red', textAlign: 'center', fontSize: 15, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', marginTop: 40, gap: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 20 },
  
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1E3A8A', marginBottom: 12, textAlign: 'center' },
  tabContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#E2E8F0', borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontWeight: '600', color: '#64748B', fontSize: 14 },
  activeTabText: { color: '#0D47A1', fontWeight: '700' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 10, marginBottom: 12, height: 44, elevation: 1 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', height: '100%', paddingVertical: 0 },

  cardRow: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  destinoName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', flex: 1 },
  
  badgeLibres: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeDisponible: { backgroundColor: '#DCFCE7' },
  badgeLleno: { backgroundColor: '#FEE2E2' },
  badgeLibresTexto: { fontSize: 12, fontWeight: '700' },

  detailsBody: { marginBottom: 12, gap: 4 },
  detailLine: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  
  capacityContainer: { marginBottom: 8, marginTop: 6 },
  capacityText: { fontSize: 13, color: '#475569', marginBottom: 6 },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  
  hijosSection: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 6 },
  hijosContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hijoBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }, 
  
  badgeApuntado: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  badgeNoApuntado: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  
  hijoTexto: { fontSize: 12, fontWeight: '700' }, 
  textoApuntado: { color: '#2E7D32' },
  textoNoApuntado: { color: '#C62828' },
});