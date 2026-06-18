import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  View, Text, ActivityIndicator, Dimensions, StyleSheet, 
  TouchableOpacity, FlatList, ScrollView, Alert 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { API_URL } from '../../config';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

// --- TIPOS Y CONSTANTES ---
type EventoAsistencia = { fecha: string; tipo: 'Pista' | 'Carrera' | 'Físico'; asistio: boolean };
type Categoria = 'U6' | 'U8' | 'U10' | 'U12' | 'U14' | 'U16' | 'FIS';
type DeportistaResumen = { deportistaId: string; nombre: string; categoria?: Categoria; asistencias: EventoAsistencia[] };
type ModoFiltro = 'todas' | 'mes' | 'temporada';
type ActiveTab = 'Técnico' | 'Físico';

const LISTA_CATEGORIAS: Categoria[] = ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'FIS'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const windowWidth = Dimensions.get('window').width;

const inSeason = (d: Date, startYear: number) => {
  const start = new Date(Date.UTC(startYear, 10, 1)); 
  const end = new Date(Date.UTC(startYear + 1, 3, 30, 23, 59, 59, 999)); 
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
};

export default function AsistenciaAdmin() {
  const [deportistas, setDeportistas] = useState<DeportistaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('Técnico');
  
  const today = useMemo(() => new Date(), []);
  const [modo, setModo] = useState<ModoFiltro>('todas'); 
  const [mesSel, setMesSel] = useState<number>(today.getMonth() + 1); 
  const [anioSel, setAnioSel] = useState<number>(today.getFullYear());
  const [seasonStart, setSeasonStart] = useState<number>(today.getFullYear());
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<Categoria[]>(LISTA_CATEGORIAS);

  const availableYears = useMemo(() => {
    const currentYear = today.getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) years.push(i);
    return years;
  }, [today]);

  const cargarDatosAsistencia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { setDeportistas([]); return; }

      const url = `${API_URL}/eventos/admin/asistencias`;
      const res = await fetchWithAuth(url, token); 
      const text = await res.text();
    
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
      
      const payload: DeportistaResumen[] = JSON.parse(text);
      setDeportistas(payload || []);
    } catch (e: any) {
      console.error('❌ Error cargando asistencia Admin:', e);
      setError(e.message || 'Error al procesar los datos de asistencia.');
      setDeportistas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      cargarDatosAsistencia();
    }
    return () => { isMounted = false; };
  }, [cargarDatosAsistencia]);

  const toggleCategoria = (cat: Categoria) => {
    if (categoriasSeleccionadas.includes(cat)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter(c => c !== cat));
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, cat]);
    }
  };

  const seleccionarTodasCategorias = () => setCategoriasSeleccionadas(LISTA_CATEGORIAS);
  const limpiarTodasCategorias = () => setCategoriasSeleccionadas([]);

  const deportistasFiltrados = useMemo(() => {
    let lista = deportistas.filter(d => d.categoria && categoriasSeleccionadas.includes(d.categoria));
    return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [deportistas, categoriasSeleccionadas]);

  const { fechasClavesOrdenadas, etiquetasVisuales } = useMemo(() => {
    const conjuntoFechas = new Set<string>();
    const mapaEtiquetas = new Map<string, { dia: string; mesAbrev: string }>();
    
    deportistas.forEach(d => {
      (d.asistencias || []).forEach(a => {
        if (a.fecha) {
          const dateParts = a.fecha.split('-').map(Number);
          const dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));

          if (dateObj && !isNaN(dateObj.getTime())) {
            const esFisico = a.tipo === 'Físico';
            const coincideTab = activeTab === 'Físico' ? esFisico : !esFisico;
            
            if (coincideTab) {
              let pasaFiltro = false;
              if (modo === 'todas') pasaFiltro = true;
              else if (modo === 'mes') {
                pasaFiltro = (dateObj.getUTCMonth() + 1 === mesSel && dateObj.getUTCFullYear() === anioSel);
              } else {
                const start = `${seasonStart}-11-01`;
                const end = `${seasonStart + 1}-04-30`;
                pasaFiltro = (a.fecha >= start && a.fecha <= end);
              }
              
              if (pasaFiltro) {
                conjuntoFechas.add(a.fecha);

                const diaStr = dateObj.getUTCDate().toString().padStart(2, '0');
                const mesesAbrev = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                const mesStr = mesesAbrev[dateObj.getUTCMonth()];
                
                mapaEtiquetas.set(a.fecha, { dia: diaStr, mesAbrev: mesStr });
              }
            }
          }
        }
      });
    });

    return {
      fechasClavesOrdenadas: Array.from(conjuntoFechas).sort(),
      etiquetasVisuales: mapaEtiquetas
    };
  }, [deportistas, activeTab, modo, mesSel, anioSel, seasonStart]);

  const mapaAsistenciaCruzada = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>();
    deportistasFiltrados.forEach(d => {
      const subMapa = new Map<string, boolean>();
      (d.asistencias || []).forEach(a => {
        subMapa.set(a.fecha, a.asistio);
      });
      map.set(d.deportistaId, subMapa);
    });
    return map;
  }, [deportistasFiltrados]);

  const handleExportCSV = async () => {
    if (fechasClavesOrdenadas.length === 0 || deportistasFiltrados.length === 0) {
      Alert.alert('Aviso', 'No hay datos de asistencia para exportar en el rango seleccionado.');
      return;
    }

    try {
      const SEPARATOR = ';'; 
      const rows: string[] = [];

      // 1. Cabecera estructurada
      const headerColumns = ['Nombre', 'Categoría', ...fechasClavesOrdenadas];
      rows.push(headerColumns.join(SEPARATOR));

      // 2. Mapeo seguro con Clave Unificada
      deportistasFiltrados.forEach((deportista) => {
        const rowData: string[] = [
          deportista.nombre,
          deportista.categoria || 'Global'
        ];

        fechasClavesOrdenadas.forEach((fecha) => {
          const subMapa = mapaAsistenciaCruzada.get(deportista.deportistaId);
          const asistio = subMapa ? subMapa.get(fecha) : undefined;
          
          if (asistio === undefined) {
            rowData.push('N/A'); 
          } else {
            rowData.push(asistio ? 'P' : 'A'); 
          }
        });

        rows.push(rowData.join(SEPARATOR));
      });

      const csvContent = rows.join('\n');
      const fileName = `Reporte_Asistencia_Admin_${activeTab}_${modo}.csv`;
      
      // 🌟 CAMBIO CRÍTICO: Usamos CachesDirectoryPath, Android otorga permisos de lectura automática aquí
      const path = `${RNFS.CachesDirectoryPath}/${fileName}`;

      // Escribimos el archivo limpio en texto plano UTF-8
      await RNFS.writeFile(path, csvContent, 'utf8');

      // 🌟 ESTRATEGIA DE COMPARTICIÓN URIS NATIVAS EN ANDROID
      const shareOptions = {
        title: 'Exportar Reporte de Asistencia',
        url: `file://${path}`,        // Forzamos el prefijo file:// explícito en la caché
        type: 'text/csv',
        filename: fileName,
        failOnCancel: false,
      };

      await Share.open(shareOptions);

    } catch (error: any) {
      console.error('❌ Error exportando matriz CSV:', error);
      
      // Capturamos el fallo específico de Android para ofrecer un plan B al usuario
      if (error && error.message && !error.message.includes('User cancelled')) {
        
        // 🛠️ PLAN B (FALLBACK): Si el menú nativo falla por culpa del emulador, guardamos en descargas
        try {
          const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
          await RNFS.writeFile(downloadPath, csvContent, 'utf8');
          Alert.alert('Archivo Guardado', `El emulador bloqueó el menú compartir, pero hemos guardado el CSV directamente en tu carpeta de Descargas del teléfono.`);
        } catch (downloadError) {
          Alert.alert('Error', 'Ocurrió un problema de permisos al compilar el reporte.');
        }
        
      }
    }
  };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#0D47A1" /></View>;
  if (error) return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        renderItem={null}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={
          <View>
            <View style={styles.headerContainer}>
              <Text style={styles.header}>Tabla de Asistencia</Text>
              {fechasClavesOrdenadas.length > 0 && (
                <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
                  <Text style={styles.exportButtonText}>📥 CSV</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Técnico' && styles.activeTab]}
                onPress={() => setActiveTab('Técnico')}>
                <Text style={[styles.tabText, activeTab === 'Técnico' && styles.activeTabText]}>Pista</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, activeTab === 'Físico' && styles.activeTab]}
                onPress={() => setActiveTab('Físico')}>
                <Text style={[styles.tabText, activeTab === 'Físico' && styles.activeTabText]}>Físico</Text>
              </TouchableOpacity>
            </View>

            <View style={multiselectStyles.container}>
              <View style={multiselectStyles.headerRows}>
                <Text style={pickerStyles.label}>Filtrar Categorías (Selección Múltiple):</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={seleccionarTodasCategorias}><Text style={multiselectStyles.quickAction}>Todas</Text></TouchableOpacity>
                  <TouchableOpacity onPress={limpiarTodasCategorias}><Text style={multiselectStyles.quickAction}>Limpiar</Text></TouchableOpacity>
                </View>
              </View>
              
              <View style={multiselectStyles.chipsGroup}>
                {LISTA_CATEGORIAS.map((cat) => {
                  const activa = categoriasSeleccionadas.includes(cat);
                  return (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => toggleCategoria(cat)}
                      style={[multiselectStyles.chip, activa && multiselectStyles.chipActivo]}
                    >
                      <Text style={[multiselectStyles.chipText, activa && multiselectStyles.chipTextActivo]}>
                        {activa ? `✓ ${cat}` : cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            <View style={styles.filterGroup}>
              <View style={[pickerStyles.section, { flex: 1 }]}>
                <Text style={pickerStyles.label}>Rango de Tiempo</Text>
                <View style={pickerStyles.pickerWrapper}>
                  <Picker 
                    selectedValue={modo} 
                    onValueChange={setModo} 
                    dropdownIconColor="#0D47A1" 
                    style={pickerStyles.pickerNative}
                  >
                    <Picker.Item label="Ver Todo" value="todas" color="#0D47A1" />
                    <Picker.Item label="Por Mes" value="mes" color="#0D47A1" />
                    <Picker.Item label="Temporada Completa" value="temporada" color="#0D47A1" />
                  </Picker>
                </View>
              </View>
            </View>
            
            {modo === 'mes' && (
              <View style={styles.filterGroup}>
                <View style={[pickerStyles.section, styles.flexItem]}>
                  <Text style={pickerStyles.label}>Mes</Text>
                  <View style={pickerStyles.pickerWrapper}>
                    <Picker 
                      selectedValue={mesSel} 
                      onValueChange={setMesSel} 
                      dropdownIconColor="#0D47A1" 
                      style={pickerStyles.pickerNative}
                    >
                      {MESES.map((name, i) => <Picker.Item key={i} label={name} value={i + 1} color="#0D47A1" />)}
                    </Picker>
                  </View>
                </View>
                <View style={[pickerStyles.section, styles.flexItem]}>
                  <Text style={pickerStyles.label}>Año</Text>
                  <View style={pickerStyles.pickerWrapper}>
                    <Picker 
                      selectedValue={anioSel} 
                      onValueChange={setAnioSel} 
                      dropdownIconColor="#0D47A1" 
                      style={pickerStyles.pickerNative}
                    >
                      {availableYears.map(year => <Picker.Item key={year} label={`${year}`} value={year} color="#0D47A1" />)}
                    </Picker>
                  </View>
                </View>
              </View>
            )}

            {modo === 'temporada' && (
              <View style={[pickerStyles.section, { width: '50%', paddingRight: 8 }]}>
                 <Text style={pickerStyles.label}>Temporada (Inicio)</Text>
                 <View style={pickerStyles.pickerWrapper}>
                   <Picker 
                     selectedValue={seasonStart} 
                     onValueChange={setSeasonStart} 
                     dropdownIconColor="#0D47A1" 
                     style={pickerStyles.pickerNative}
                   >
                     {availableYears.map(year => <Picker.Item key={year} label={`${year}-${year + 1}`} value={year} color="#0D47A1" />)}
                   </Picker>
                 </View>
              </View>
            )}

            {fechasClavesOrdenadas.length > 0 ? (
              <View style={matrixStyles.mainWrapper}>
                
                <View style={matrixStyles.fixedColumnContainer}>
                  <View style={matrixStyles.fixedHeaderCell}>
                    <Text style={matrixStyles.headerAthleteText}>Nombre</Text>
                  </View>
                  {deportistasFiltrados.length > 0 ? (
                    deportistasFiltrados.map((item) => (
                      <View key={`fixed-${item.deportistaId}`} style={matrixStyles.fixedBodyCell}>
                        <Text style={matrixStyles.athleteNameText} numberOfLines={1}>
                          {item.nombre}
                        </Text>
                        <Text style={matrixStyles.athleteCatSubtext}>
                          {item.categoria || 'Global'}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={matrixStyles.fixedBodyCell}>
                      <Text style={[matrixStyles.athleteNameText, { color: '#888', fontStyle: 'italic' }]}>Sin alumnos</Text>
                    </View>
                  )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={matrixStyles.scrollableArea}>
                  <View style={{ flexDirection: 'column' }}>
                    
                    <View style={matrixStyles.scrollableHeaderRow}>
                      {fechasClavesOrdenadas.map((dateKey) => {
                        const metaLabel = etiquetasVisuales.get(dateKey) || { dia: '00', mesAbrev: 'MAY' };
                        return (
                          <View key={`h-${dateKey}`} style={matrixStyles.columnHeaderDateContainer}>
                            <Text style={matrixStyles.columnHeaderDay}>{metaLabel.dia}</Text>
                            <Text style={matrixStyles.columnHeaderMonth}>{metaLabel.mesAbrev}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {deportistasFiltrados.length > 0 ? (
                      deportistasFiltrados.map((item) => (
                        <View key={`scroll-row-${item.deportistaId}`} style={matrixStyles.scrollableBodyRow}>
                          {fechasClavesOrdenadas.map((dateKey) => {
                            // Corrección estricta también aquí para el renderizado visual
                            const subMapa = mapaAsistenciaCruzada.get(item.deportistaId);
                            const asistio = subMapa ? subMapa.get(dateKey) : undefined;
                            return (
                              <View key={`c-${item.deportistaId}-${dateKey}`} style={matrixStyles.cell}>
                                <Text style={matrixStyles.emojiIcon}>
                                  {asistio === undefined ? '➖' : asistio ? '✅' : '❌'}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      ))
                    ) : (
                      <View style={matrixStyles.scrollableBodyRow}>
                        {fechasClavesOrdenadas.map((dateKey) => (
                          <View key={`empty-cell-${dateKey}`} style={matrixStyles.cell}>
                            <Text style={[matrixStyles.emojiIcon, { color: '#ccc' }]}>-</Text>
                          </View>
                        ))}
                      </View>
                    )}

                  </View>
                </ScrollView>

              </View>
            ) : (
              <Text style={styles.noDataText}>
                No se encontraron entrenamientos creados en el rango de tiempo seleccionado.
              </Text>
            )}

          </View>
        }
      />
    </View>
  );
}

// --- HOJAS DE ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', textAlign: 'center', fontWeight: 'bold' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10, paddingRight: 4 },
  header: { fontSize: 22, fontWeight: '700', color: '#0D47A1', textAlign: 'left', flex: 1 },
  noDataText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 15, fontStyle: 'italic', backgroundColor: '#fff', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#CFD8DC' },
  tabContainer: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#E0E0E0', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontWeight: '600', color: '#666', fontSize: 14 },
  activeTabText: { color: '#0D47A1' },
  filterGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  flexItem: { flex: 1, marginHorizontal: 4 },
  exportButton: {
    backgroundColor: '#0D47A1',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

const pickerStyles = StyleSheet.create({
  section: { marginTop: 6, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#0D47A1', marginBottom: 6, marginLeft: 2 },
  pickerWrapper: { 
    borderRadius: 10, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#CFD8DC', 
    overflow: 'hidden',
    height: 54,                  
    justifyContent: 'center',     
    paddingLeft: 4
  },
  pickerNative: { 
    width: '100%',
    color: '#0D47A1',
    backgroundColor: 'transparent'
  },
});

const multiselectStyles = StyleSheet.create({
  container: { marginVertical: 8, backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#CFD8DC', elevation: 1 },
  headerRows: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  quickAction: { fontSize: 12, fontWeight: 'bold', color: '#0D47A1', textDecorationLine: 'underline' },
  chipsGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#ECEFF1', borderWidth: 1, borderColor: '#CFD8DC' },
  chipActivo: { backgroundColor: '#E0F2FE', borderColor: '#0D47A1' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#546E7A' },
  chipTextActivo: { color: '#0D47A1', fontWeight: '700' }
});

const matrixStyles = StyleSheet.create({
  mainWrapper: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ECEFF1', overflow: 'hidden', marginTop: 10, elevation: 2 },
  fixedColumnContainer: { width: 115, backgroundColor: '#fff', borderRightWidth: 1.5, borderRightColor: '#CFD8DC', zIndex: 10 },
  fixedHeaderCell: { height: 48, backgroundColor: '#0D47A1', justifyContent: 'center', paddingHorizontal: 10 },
  headerAthleteText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  fixedBodyCell: { height: 54, justifyContent: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#ECEFF1', backgroundColor: '#fff' },
  athleteNameText: { fontSize: 13, color: '#263238', fontWeight: '600' },
  athleteCatSubtext: { fontSize: 10, color: '#0D47A1', fontWeight: '700', marginTop: 1 },
  scrollableArea: { flex: 1, backgroundColor: '#fff' },
  scrollableHeaderRow: { flexDirection: 'row', backgroundColor: '#0D47A1', height: 48, alignItems: 'center' },
  columnHeaderDateContainer: { width: 50, alignItems: 'center', justifyContent: 'center' }, 
  columnHeaderDay: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  columnHeaderMonth: { color: '#E3F2FD', fontWeight: '600', fontSize: 9 },
  scrollableBodyRow: { flexDirection: 'row', height: 54, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ECEFF1' },
  cell: { width: 50, alignItems: 'center', justifyContent: 'center' }, 
  emojiIcon: { fontSize: 19, textAlign: 'center' }
});