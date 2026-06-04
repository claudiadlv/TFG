import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Dimensions, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { API_URL } from '../../config';
import { PieChart } from 'react-native-chart-kit';

type AsistenciaPadrePayload = {
  hijoId: string;
  nombre: string;
  asistencias: { fecha: string, tipo: 'Pista' | 'Carrera' | 'Físico' }[];
  totalEntrenamientosMes: number;
};
type TipoAsistencia = 'Pista' | 'Carrera' | 'Físico' | 'Faltas';
type ChartDataPoint = {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const windowWidth = Dimensions.get('window').width;

const TIPO_COLORS: Record<TipoAsistencia, string> = {
  Pista: '#1E88E5',
  Carrera: '#B71C1C',
  Físico: '#3DBE60',
  Faltas: '#E0E0E0',
};

const TZ = 'Europe/Madrid';

const parseAsLocalDate = (s: string) => {
  if (!s) return new Date(NaN);
  if (s.includes('T')) return new Date(s);
  const [y, m, d] = s.slice(0, 10).split('-').map(n => parseInt(n, 10));
  return new Date(y, m - 1, d, 12, 0, 0);
};

const formatDateEs = (d: Date) =>
  d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: TZ });

export default function AsistenciaPadre() {
  const [hijos, setHijos] = useState<AsistenciaPadrePayload[]>([]);
  const [hijoSeleccionadoId, setHijoSeleccionadoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const [mesSel, setMesSel] = useState<number>(today.getMonth() + 1);
  const [anioSel, setAnioSel] = useState<number>(today.getFullYear());
  const [activeTab, setActiveTab] = useState<'Técnico' | 'Físico'>('Técnico');
  const [selectedSlice, setSelectedSlice] = useState<{ title: TipoAsistencia; dates: Date[] } | null>(null);

  const chartSize = useMemo(() => Math.min(windowWidth - 64, 300), []);
  const donutSize = useMemo(() => Math.round(chartSize * 0.6), [chartSize]);

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
      if (!token) return;
      const res = await fetchWithAuth(`${API_URL}/eventos/padre/asistencias?mes=${mesSel}&anio=${anioSel}`, token);
      if (!res.ok) throw new Error('Error al cargar los datos');
      const payload: AsistenciaPadrePayload[] = await res.json();
      setHijos(payload);
      if (!hijoSeleccionadoId && payload.length > 0) setHijoSeleccionadoId(payload[0].hijoId);
    } catch {
      setError('No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, [mesSel, anioSel, hijoSeleccionadoId]);

  useEffect(() => { cargar(); }, [cargar]);

  const { chartData, legendData, totalPercentage, allDatesByType, totalProgramados, asistidosCount } = useMemo(() => {
    const datosDelHijo = hijos.find(h => h.hijoId === hijoSeleccionadoId);

    const defaultData = { 
      chartData: [] as ChartDataPoint[], 
      legendData: {} as Record<string, number>, 
      totalPercentage: 0, 
      allDatesByType: new Map<TipoAsistencia, Date[]>(),
      totalProgramados: 0,
      asistidosCount: 0
    };

    if (!datosDelHijo) return defaultData;

    const asistenciasDelMes = datosDelHijo.asistencias.map(a => ({ ...a, fechaObj: parseAsLocalDate(a.fecha) }));
    const datesByType = new Map<TipoAsistencia, Date[]>();
    datesByType.set('Pista', asistenciasDelMes.filter(a => a.tipo === 'Pista').map(a => a.fechaObj));
    datesByType.set('Carrera', asistenciasDelMes.filter(a => a.tipo === 'Carrera').map(a => a.fechaObj));
    datesByType.set('Físico', asistenciasDelMes.filter(a => a.tipo === 'Físico').map(a => a.fechaObj));

    const data: ChartDataPoint[] = [];
    const legend: Record<string, number> = {};

    // SOLUCIÓN AQUÍ: 
    // Si el backend aún no envía totalTecnico/totalFisico, usamos el totalEntrenamientosMes
    // Pero restamos las asistencias de la OTRA categoría para aproximar el total de la actual.
    let programados = 0;
    let asistidos = 0;

    if (activeTab === 'Técnico') {
      const pistaCount = datesByType.get('Pista')?.length || 0;
      const carreraCount = datesByType.get('Carrera')?.length || 0;
      const fisicoCount = datesByType.get('Físico')?.length || 0;

      asistidos = pistaCount + carreraCount;
      // Si no existen las variables desglosadas, calculamos el total restando los físicos al total general
      programados = (datosDelHijo as any).totalTecnico ?? (datosDelHijo.totalEntrenamientosMes - fisicoCount);

      if (pistaCount > 0) {
        data.push({ name: 'Pista', population: pistaCount, color: TIPO_COLORS.Pista, legendFontColor: 'transparent', legendFontSize: 0 });
        legend['Pista'] = pistaCount;
      }
      if (carreraCount > 0) {
        data.push({ name: 'Carrera', population: carreraCount, color: TIPO_COLORS.Carrera, legendFontColor: 'transparent', legendFontSize: 0 });
        legend['Carrera'] = carreraCount;
      }
    } else {
      const fisicoCount = datesByType.get('Físico')?.length || 0;
      const tecnicoCount = (datesByType.get('Pista')?.length || 0) + (datesByType.get('Carrera')?.length || 0);

      asistidos = fisicoCount;
      programados = (datosDelHijo as any).totalFisico ?? (datosDelHijo.totalEntrenamientosMes - tecnicoCount);

      if (fisicoCount > 0) {
        data.push({ name: 'Físico', population: fisicoCount, color: TIPO_COLORS.Físico, legendFontColor: 'transparent', legendFontSize: 0 });
        legend['Físico'] = fisicoCount;
      }
    }

    const percentage = programados > 0 ? Math.round((asistidos / programados) * 100) : 0;

    if (data.length === 0) {
      data.push({ name: 'Sin datos', population: 1, color: '#E0E0E0', legendFontColor: 'transparent', legendFontSize: 0 });
    }

    return { 
      chartData: data, 
      legendData: legend, 
      totalPercentage: percentage, 
      allDatesByType: datesByType,
      totalProgramados: programados,
      asistidosCount: asistidos
    };
  }, [hijos, hijoSeleccionadoId, activeTab]);

  useEffect(() => { setSelectedSlice(null); }, [JSON.stringify(chartData)]);

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#0D47A1" /></View>;
  if (error) return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Asistencia</Text>

      {hijos.length > 1 && (
        <View style={pickerStyles.section}>
          <Text style={pickerStyles.label}>Mostrando asistencia de:</Text>
          <View style={pickerStyles.pickerContainer}>
            <Picker<string> selectedValue={hijoSeleccionadoId ?? ''} onValueChange={(v) => setHijoSeleccionadoId(v)} dropdownIconColor="#0D47A1" style={pickerStyles.picker}>
              {hijos.map(h => <Picker.Item key={h.hijoId} label={h.nombre} value={h.hijoId} color="#0D47A1" />)}
            </Picker>
          </View>
        </View>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Técnico' && styles.activeTab]} onPress={() => setActiveTab('Técnico')}>
          <Text style={[styles.tabText, activeTab === 'Técnico' && styles.activeTabText]}>Entrenamiento Pista</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'Físico' && styles.activeTab]} onPress={() => setActiveTab('Físico')}>
          <Text style={[styles.tabText, activeTab === 'Físico' && styles.activeTabText]}>Preparación Física</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterGroup}>
        <View style={[pickerStyles.section, styles.flexItem]}>
          <Text style={pickerStyles.label}>Mes</Text>
          <View style={pickerStyles.pickerContainer}>
            <Picker<number> selectedValue={mesSel} onValueChange={(v) => setMesSel(v)} dropdownIconColor="#0D47A1" style={pickerStyles.picker}>
              {MESES.map((name, i) => <Picker.Item key={i} label={name} value={i + 1} color="#0D47A1" />)}
            </Picker>
          </View>
        </View>
        <View style={[pickerStyles.section, styles.flexItem]}>
          <Text style={pickerStyles.label}>Año</Text>
          <View style={pickerStyles.pickerContainer}>
            <Picker<number> selectedValue={anioSel} onValueChange={(v) => setAnioSel(v)} dropdownIconColor="#0D47A1" style={pickerStyles.picker}>
              {availableYears.map(year => <Picker.Item key={year} label={`${year}`} value={year} color="#0D47A1" />)}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.subheader}>Resumen del Mes</Text>
        <View style={[styles.pieChartWrapper, { width: chartSize, height: chartSize }]}>
          <PieChart
            data={chartData}
            width={chartSize}
            height={chartSize}
            chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
            accessor="population"
            backgroundColor="transparent"
            center={[0, 0]}
            absolute
            hasLegend={false}
            paddingLeft="60"
          />
          <View style={styles.donutHoleContainer}>
            <Text style={styles.donutMainText}>
              {asistidosCount} / {totalProgramados}
            </Text>
            <Text style={styles.donutSubText}>Asistencias</Text>
            <Text style={styles.donutPercentageText}>{totalPercentage}%</Text>
          </View>
        </View>

        <View style={styles.legendContainer}>
          {Object.keys(legendData).map(k => {
            const key = k as TipoAsistencia;
            const dates = allDatesByType.get(key) || [];
            const isActive = selectedSlice?.title === key;
            return (
              <TouchableOpacity key={k} onPress={() => setSelectedSlice(prev => (prev?.title === key ? null : { title: key, dates }))}>
                <View style={[styles.legendItem, isActive && { borderWidth: 1, borderColor: '#0D47A1' }]}>
                  <View style={[styles.legendColor, { backgroundColor: TIPO_COLORS[key] }]} />
                  <Text style={styles.legendText}>{k}: </Text>
                  <Text style={[styles.legendText, { fontWeight: 'bold' }]}>{(legendData as any)[k]}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedSlice && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Días de: {selectedSlice.title}</Text>
            {selectedSlice.dates.length > 0 ? (
              selectedSlice.dates.map(d => (
                <Text key={d.toISOString()} style={styles.detailsText}>{formatDateEs(d)}</Text>
              ))
            ) : (
              <Text style={styles.detailsText}>No hay registros.</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', textAlign: 'center' },
  header: { fontSize: 24, fontWeight: '700', color: '#0D47A1', marginTop: 10, marginBottom: 10 },
  subheader: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 18, textAlign: 'center' },
  chartContainer: { marginTop: 12, alignItems: 'center' },
  pieChartWrapper: { alignItems: 'center', justifyContent: 'center' },
  filterGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  flexItem: { flex: 1, marginHorizontal: 4 },
  tabContainer: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#E0E0E0', borderRadius: 8, padding: 2 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontWeight: '600', color: '#666' },
  activeTabText: { color: '#0D47A1' },
  legendContainer: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginVertical: 4, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 9999, backgroundColor: '#fff', elevation: 1 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 14, color: '#333' },
  detailsContainer: { marginTop: 20, width: '100%', backgroundColor: '#fff', borderRadius: 8, padding: 16, elevation: 2 },
  detailsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#0D47A1' },
  detailsText: { fontSize: 14, color: '#333', paddingVertical: 4 },

  donutHoleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 120, // Ajusta según tu donutSize
    height: 120,
    backgroundColor: '#F4F7F9',
    borderRadius: 60,
  },
  donutMainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  donutSubText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  donutPercentageText: {
    fontSize: 14,
    color: '#0D47A1',
    fontWeight: 'bold',
  },
});

const pickerStyles = StyleSheet.create({
  section: { marginTop: 8, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#0D47A1', marginBottom: 6, marginLeft: 4 },
  pickerContainer: { borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B0BEC5', overflow: 'hidden', elevation: 1 },
  picker: { height: 48, color: '#0D47A1' },
});
