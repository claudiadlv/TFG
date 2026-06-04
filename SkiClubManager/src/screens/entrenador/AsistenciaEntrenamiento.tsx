import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  View, Text, ActivityIndicator, Dimensions, StyleSheet, 
  TouchableOpacity, FlatList, ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { BarChart } from 'react-native-chart-kit';
import { API_URL } from '../../config';

// --- TIPOS Y CONSTANTES ---
type EventoAsistencia = { fecha: string; tipo: 'Pista' | 'Carrera' | 'Físico' };
type DeportistaResumen = { deportistaId: string; nombre: string; asistencias: EventoAsistencia[]; };
type ModoFiltro = 'todas' | 'mes' | 'temporada';
type ActiveTab = 'Técnico' | 'Físico';
type PuntoGrafico = { date: Date; tipo: EventoAsistencia['tipo']; deportistaId: string; };

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const windowWidth = Dimensions.get('window').width;

const TIPO_COLORS = {
  Pista: '#1E88E5',
  Carrera: '#B71C1C',
};

const inSeason = (d: Date, startYear: number) => {
  const start = new Date(Date.UTC(startYear, 11, 1));
  const end = new Date(Date.UTC(startYear + 1, 3, 30, 23, 59, 59, 999));
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
};

export default function AsistenciaEntrenador() {
  const [deportistas, setDeportistas] = useState<DeportistaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Técnico');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const [modo, setModo] = useState<ModoFiltro>('mes');
  const [mesSel, setMesSel] = useState<number>(today.getMonth() + 1); 
  const [anioSel, setAnioSel] = useState<number>(today.getFullYear());
  const [seasonStart, setSeasonStart] = useState<number>(today.getFullYear());
  const availableYears = useMemo(() => {
    const currentYear = today.getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) years.push(i);
    return years;
  }, [today]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { setDeportistas([]); return; }
      const res = await fetchWithAuth(`${API_URL}/eventos/entrenador/asistencias`, token); 
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
      const payload: DeportistaResumen[] = JSON.parse(text);
      setDeportistas(payload || []);
    } catch (e: any) {
      console.error('Error cargando asistencia:', e);
      setError('No se pudieron cargar los datos.');
      setDeportistas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const todosLosDeportistas = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string }>();
    deportistas.forEach(d => {
      if (!map.has(d.deportistaId)) map.set(d.deportistaId, { id: d.deportistaId, nombre: d.nombre });
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [deportistas]);

  const puntosConsolidados = useMemo(() => {
    const allPuntos: PuntoGrafico[] = [];
    deportistas.forEach(d => {
      d.asistencias.forEach(a => {
        const dateParts = a.fecha.split('T')[0].split('-').map(Number);
        const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2] + 1)); 
        if (date && !isNaN(date.getTime())) {
          allPuntos.push({ date, tipo: a.tipo, deportistaId: d.deportistaId });
        }
      });
    });
    return allPuntos.sort((x, y) => x.date.getTime() - y.date.getTime()); 
  }, [deportistas]);

  const puntosPorTab = useMemo(() => {
    if (activeTab === 'Físico') return puntosConsolidados.filter(p => p.tipo === 'Físico');
    return puntosConsolidados.filter(p => p.tipo === 'Pista' || p.tipo === 'Carrera');
  }, [puntosConsolidados, activeTab]);

  const puntosFiltrados = useMemo(() => {
    if (modo === 'todas') return puntosPorTab;
    if (modo === 'mes') {
      return puntosPorTab.filter(p => p.date.getUTCMonth() + 1 === mesSel && p.date.getUTCFullYear() === anioSel);
    }
    return puntosPorTab.filter(p => inSeason(p.date, seasonStart));
  }, [puntosPorTab, modo, mesSel, anioSel, seasonStart]);

  const asistenciaPorFecha = useMemo(() => {
    const map = new Map<string, Set<string>>();
    puntosFiltrados.forEach(p => {
      const key = p.date.toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(p.deportistaId);
    });
    return map;
  }, [puntosFiltrados]);

  // Se separa la lógica del gráfico para obtener también el número máximo de asistentes
  const { chartData, maxAttendance } = useMemo(() => {
    const byDate: Record<string, PuntoGrafico[]> = {};
    puntosFiltrados.forEach(p => {
      const k = p.date.toISOString().slice(0, 10); 
      (byDate[k] ||= []).push(p);
    });
    
    const keys = Object.keys(byDate).sort();
    const dailyTotals = keys.map(k => byDate[k].length);
    const maxAtt = Math.max(...dailyTotals, 0);
    
    const labels: string[] = [];
    const labelColors: string[] = [];

    keys.forEach(k => {
      const d = new Date(k + 'T12:00:00Z');
      labels.push(d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', timeZone: 'UTC' }).replace('.', ''));
      
      const dayEvents = byDate[k];
      if (dayEvents.some(e => e.tipo === 'Carrera')) {
        labelColors.push(TIPO_COLORS.Carrera);
      } else {
        labelColors.push(TIPO_COLORS.Pista);
      }
    });
    
    const data = { 
      labels, 
      datasets: [{ data: dailyTotals }],
      labelColors,
      dateKeys: keys,
    };
    
    return { chartData: data, maxAttendance: maxAtt };
  }, [puntosFiltrados]);

  const handleDateSelect = (dateKey: string) => {
    setSelectedDate(dateKey);
  };
  
  useEffect(() => {
    if (chartData.dateKeys.length > 0) {
      setSelectedDate(chartData.dateKeys[chartData.dateKeys.length - 1]);
    } else {
      setSelectedDate(null);
    }
  }, [chartData.dateKeys]);

  const handleExport = async () => { /* ...código de exportar sin cambios... */ };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#0D47A1" /></View>;
  if (error) return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;
  
const renderHeader = () => (
    <View style={styles.contentContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Asistencia de Deportistas</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Técnico' && styles.activeTab]}
          onPress={() => setActiveTab('Técnico')}>
          <Text style={[styles.tabText, activeTab === 'Técnico' && styles.activeTabText]}>Entrenamiento Pista</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Físico' && styles.activeTab]}
          onPress={() => setActiveTab('Físico')}>
          <Text style={[styles.tabText, activeTab === 'Físico' && styles.activeTabText]}>Preparación Física</Text>
        </TouchableOpacity>
      </View>

      <View style={pickerStyles.section}>
        <Text style={pickerStyles.label}>Ver por</Text>
        <View style={pickerStyles.pickerContainer}>
          <Picker selectedValue={modo} onValueChange={setModo} dropdownIconColor="#0D47A1" style={pickerStyles.picker}>
            <Picker.Item label="Mes" value="mes" color="#0D47A1" />
            <Picker.Item label="Temporada (Dic–Abr)" value="temporada" color="#0D47A1" />
            <Picker.Item label="Todos los Eventos" value="todas" color="#0D47A1" />
          </Picker>
        </View>
      </View>
      
      {modo === 'mes' && (
        <View style={styles.filterGroup}>
          <View style={[pickerStyles.section, styles.flexItem]}>
            <Text style={pickerStyles.label}>Mes</Text>
            <View style={pickerStyles.pickerContainer}>
              <Picker selectedValue={mesSel} onValueChange={setMesSel} dropdownIconColor="#0D47A1" style={pickerStyles.picker}>
                {MESES.map((name, i) => <Picker.Item key={i} label={name} value={i + 1} color="#0D47A1" />)}
              </Picker>
            </View>
          </View>
          <View style={[pickerStyles.section, styles.flexItem]}>
            <Text style={pickerStyles.label}>Año</Text>
            <View style={pickerStyles.pickerContainer}>
              <Picker selectedValue={anioSel} onValueChange={setAnioSel} dropdownIconColor="#0D47A1" style={pickerStyles.picker}>
                {availableYears.map(year => <Picker.Item key={year} label={`${year}`} value={year} color="#0D47A1" />)}
              </Picker>
            </View>
          </View>
        </View>
      )}

      {modo === 'temporada' && (
        <View style={[pickerStyles.section, { width: '50%', paddingRight: 8 }]}>
           <Text style={pickerStyles.label}>Temporada (Inicio)</Text>
           <View style={pickerStyles.pickerContainer}>
             <Picker selectedValue={seasonStart} onValueChange={setSeasonStart} dropdownIconColor="#0D47A1" style={pickerStyles.picker}>
               {availableYears.map(year => <Picker.Item key={year} label={`${year}-${year + 1}`} value={year} color="#0D47A1" />)}
             </Picker>
           </View>
        </View>
      )}

      {/* GRÁFICO DE BARRAS MEJORADO CON SCROLL HORIZONTAL */}
      {chartData.labels.length > 0 && (
        <>
          <Text style={styles.subheader}>Asistencia Diaria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginBottom: 10 }}>
            <View style={{ width: Math.max(windowWidth - 32, chartData.labels.length * 60), paddingRight: 16 }}>
              <BarChart
                data={{ 
                  labels: chartData.labels.map(() => ''), 
                  datasets: chartData.datasets 
                }}
                width={Math.max(windowWidth - 32, chartData.labels.length * 60) - 20}
                height={200}
                fromZero
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
                withHorizontalLabels={true}
                segments={maxAttendance < 5 ? maxAttendance : 4}
              />
              
              <View style={styles.customXAxisContainer}>
                {chartData.labels.map((label, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.customXAxisLabel, { width: 45, flexGrow: 0, flexShrink: 0 }]} // <--- Cambiado aquí
                    onPress={() => handleDateSelect(chartData.dateKeys[index])}>
                    <Text style={{ 
                      color: chartData.labelColors[index], 
                      fontSize: 10, 
                      fontWeight: chartData.dateKeys[index] === selectedDate ? 'bold' : 'normal',
                      textAlign: 'center'
                    }}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {activeTab === 'Técnico' && (
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: TIPO_COLORS.Pista }]} />
                <Text style={styles.legendText}>Entreno Pista</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: TIPO_COLORS.Carrera }]} />
                <Text style={styles.legendText}>Día de Carrera</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  /* --- RETURN PRINCIPAL DE LA PANTALLA --- */
  return (
    <View style={styles.container}>
      {/* Lista contenedora para desplazar toda la pantalla verticalmente si es necesario */}
      <FlatList
        data={chartData.labels.length > 0 ? todosLosDeportistas : []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          chartData.labels.length === 0 ? (
            <Text style={styles.noDataText}>
              No hay asistencias registradas para el período seleccionado.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            {/* Si es el primer elemento de la lista, pintamos la cabecera de la tabla */}
            {todosLosDeportistas[0]?.id === item.id && (
              <View style={[matrixStyles.tableHeader, { marginTop: 15 }]}>
                <Text style={matrixStyles.headerAthlete}>Deportista</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={matrixStyles.headerScroll}>
                  <View style={{ flexDirection: 'row' }}>
                    {chartData.labels.map((label, idx) => (
                      <Text key={idx} style={matrixStyles.columnHeaderDate}>
                        {label}
                      </Text>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Fila del deportista con sus estados */}
            <View style={matrixStyles.row}>
              <Text style={matrixStyles.athleteName} numberOfLines={1}>
                {item.nombre}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={matrixStyles.rowScroll}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {chartData.dateKeys.map((dateKey) => {
                    const asistio = asistenciaPorFecha.get(dateKey)?.has(item.id);
                    return (
                      <View key={dateKey} style={matrixStyles.cell}>
                        <Text style={[
                          matrixStyles.badge, 
                          asistio ? matrixStyles.badgePresente : matrixStyles.badgeAusente
                        ]}>
                          {asistio ? 'P' : 'A'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
  barPercentage: 0.7,
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#e3e3e3',
  },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 10 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', textAlign: 'center' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  header: { fontSize: 24, fontWeight: '700', color: '#0D47A1' },
  subheader: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 24, marginBottom: 8 },
  chart: { borderRadius: 12, paddingRight: 35, paddingTop: 10 },
  noDataText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16, fontStyle: 'italic' },
  tabContainer: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#E0E0E0', borderRadius: 8, padding: 2 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontWeight: '600', color: '#666' },
  activeTabText: { color: '#0D47A1' },
  filterGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  flexItem: { flex: 1, marginHorizontal: 4 },
  legendContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 15, 
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 10, 
  },
  legendColor: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    marginRight: 5 
  },
  legendText: { 
    fontSize: 12, 
    color: '#333', 
  },
  customXAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  customXAxisLabel: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});

const pickerStyles = StyleSheet.create({
  section: { marginTop: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#0D47A1', marginBottom: 6, marginLeft: 4 },
  pickerContainer: { borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B0BEC5', overflow: 'hidden', elevation: 1 },
  picker: { height: 48, color: '#0D47A1' },
});

const matrixStyles = StyleSheet.create({
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0D47A1',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
  },
  headerAthlete: {
    width: 110,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerScroll: {
    flex: 1,
  },
  columnHeaderDate: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
    width: 50,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  athleteName: {
    width: 110,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  rowScroll: {
    flex: 1,
  },
  cell: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: 12,
    fontWeight: 'bold',
    borderRadius: 4,
    overflow: 'hidden',
    textAlign: 'center',
    width: 26,
    paddingVertical: 2,
  },
  badgePresente: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  badgeAusente: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
  },
});