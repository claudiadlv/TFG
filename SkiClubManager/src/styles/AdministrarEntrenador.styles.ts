import { StyleSheet, Dimensions } from 'react-native';

const windowWidth = Dimensions.get('window').width;

export const TIPO_COLORS = {
  Pista: '#1E88E5',
  Carrera: '#B71C1C',
};

export const chartConfig = {
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

export default StyleSheet.create({
  // --- TUS ESTILOS EXISTENTES (FORMULARIOS) ---
  containerForm: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  titleForm: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A56E2',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F2F2F2',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  pickerForm: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    marginBottom: 15,
  },
  datePickerButton: {
    backgroundColor: '#4A56E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  datePickerText: {
    color: 'white',
    fontSize: 16,
  },
  buttonForm: {
    backgroundColor: '#4A56E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonTextForm: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // --- NUEVOS ESTILOS INTERFAZ DE ASISTENCIA ---
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
  exportButton: {
    backgroundColor: '#0D47A1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // --- ESTILOS PICKERS ASISTENCIA ---
  pickerSection: { marginTop: 8 },
  pickerLabel: { fontSize: 13, fontWeight: '700', color: '#0D47A1', marginBottom: 6, marginLeft: 4 },
  pickerContainer: { borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B0BEC5', overflow: 'hidden', elevation: 1 },
  picker: { height: 48, color: '#0D47A1' },

  // --- ESTILOS MATRIZ / TABLA ---
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