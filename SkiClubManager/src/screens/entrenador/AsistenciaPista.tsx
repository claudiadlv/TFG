import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  View, Text, ActivityIndicator, StyleSheet, 
  TouchableOpacity, ScrollView 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

type EventoAsistencia = { fecha: string; tipo: 'Pista' | 'Carrera' | 'Físico'; id: string; };
type DeportistaResumen = { deportistaId: string; nombre: string; asistencias: EventoAsistencia[]; };
type ActiveTab = 'Técnico' | 'Físico';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const COLUMN_WIDTH = 60;

export default function AsistenciaEntrenador() {
  const [deportistas, setDeportistas] = useState<DeportistaResumen[]>([]);
  const [eventosGlobales, setEventosGlobales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Técnico');
  const [mesSel, setMesSel] = useState<number>(new Date().getMonth() + 1);
  const [anioSel, setAnioSel] = useState<number>(2026); // Fijado en 2026

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/eventos/entrenador/asistencias`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        setDeportistas([]);
        return;
      }

      const payload = await res.json();
      
      if (payload && payload.deportistas) {
        setDeportistas(payload.deportistas);
        setEventosGlobales(payload.eventosGlobales || []);
      } else {
        setDeportistas([]);
        setEventosGlobales([]);
      }
    } catch (e) {
      console.error('Error cargando asistencia:', e);
      setDeportistas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const listaDeportistas = useMemo(() => {
    return deportistas.map(d => ({ id: d.deportistaId, nombre: d.nombre }))
      .filter((value, index, self) => self.findIndex(t => t.id === value.id) === index)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [deportistas]);

  const fechasEvento = useMemo(() => {
    const fechas = new Set<string>();
    
    eventosGlobales.forEach(e => {
      if (!e.fecha) return;
      
      const dStr = e.fecha.substring(0, 10); 
      const partes = dStr.split('-');
      
      const anio = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10);
      
      if (mes === mesSel && anio === anioSel) {
        if (activeTab === 'Físico' && e.tipo === 'Físico') {
          fechas.add(dStr);
        }
        if (activeTab === 'Técnico' && (e.tipo === 'Pista' || e.tipo === 'Carrera')) {
          fechas.add(dStr);
        }
      }
    });
    
    return Array.from(fechas).sort();
  }, [eventosGlobales, mesSel, anioSel, activeTab]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0D47A1" />;

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Tabla de Asistencia</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Técnico' && styles.activeTab]} onPress={() => setActiveTab('Técnico')}>
            <Text style={[styles.tabText, activeTab === 'Técnico' && styles.activeTabText]}>Pista</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'Físico' && styles.activeTab]} onPress={() => setActiveTab('Físico')}>
            <Text style={[styles.tabText, activeTab === 'Físico' && styles.activeTabText]}>Físico</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Picker selectedValue={mesSel} style={{ flex: 1 }} onValueChange={setMesSel}>
            {MESES.map((m, i) => <Picker.Item key={i} label={m} value={i + 1} />)}
          </Picker>
          <Picker selectedValue={anioSel} style={{ flex: 1 }} onValueChange={setAnioSel}>
            {[2025, 2026].map(y => <Picker.Item key={y} label={`${y}`} value={y} />)}
          </Picker>
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={styles.fixedColumn}>
          <View style={styles.headerCell}><Text style={styles.headerText}>Nombre</Text></View>
          {listaDeportistas.map(dep => (
            <View key={dep.id} style={styles.nameCell}>
              <Text numberOfLines={1} style={styles.nameText}>{dep.nombre}</Text>
            </View>
          ))}
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            <View style={{ flexDirection: 'row' }}>
              {fechasEvento.map(fecha => {
                const [,,, dia] = fecha.match(/(\d+)-(\d+)-(\d+)/) || [];
                const mesNum = parseInt(fecha.split('-')[1]) - 1;
                return (
                  <View key={fecha} style={styles.headerCellDate}>
                    <Text style={styles.dateText}>{fecha.split('-')[2]}</Text>
                    <Text style={styles.monthText}>{MESES[mesNum].slice(0, 3)}</Text>
                  </View>
                );
              })}
              {fechasEvento.length === 0 && (
                <View style={styles.noDataCell}>
                  <Text style={{ color: '#666', fontStyle: 'italic' }}>Sin entrenamientos</Text>
                </View>
              )}
            </View>
            
            {listaDeportistas.map(dep => (
              <View key={dep.id} style={{ flexDirection: 'row' }}>
                {fechasEvento.map(fecha => {
                  const asistio = deportistas.find(d => d.deportistaId === dep.id)
                    ?.asistencias.some(a => a.fecha.split('T')[0] === fecha);
                  return (
                    <View key={fecha} style={styles.statusCell}>
                      <Text style={{ fontSize: 18 }}>{asistio ? '✅' : '❌'}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerSection: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, backgroundColor: '#F4F7F9', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0D47A1' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E0E0E0', borderRadius: 8, padding: 2, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTab: { backgroundColor: '#fff' },
  tabText: { fontWeight: 'bold', color: '#666' },
  activeTabText: { color: '#0D47A1' },
  filterRow: { flexDirection: 'row' },
  fixedColumn: { width: 110, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#E0E0E0', zIndex: 10 },
  headerCell: { height: 50, justifyContent: 'center', paddingHorizontal: 8, backgroundColor: '#0D47A1' },
  headerCellDate: { width: COLUMN_WIDTH, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D47A1', borderLeftWidth: 1, borderLeftColor: '#1565C0' },
  headerText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  dateText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  monthText: { color: '#fff', fontSize: 10, textTransform: 'uppercase' },
  nameCell: { height: 45, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  nameText: { fontSize: 13, color: '#333', fontWeight: '500' },
  statusCell: { width: COLUMN_WIDTH, height: 45, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', borderLeftWidth: 1, borderLeftColor: '#F0F0F0' },
  noDataCell: { padding: 15, justifyContent: 'center' },
});