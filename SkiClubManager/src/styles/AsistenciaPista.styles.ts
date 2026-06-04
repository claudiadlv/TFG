import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F9' },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 10 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', textAlign: 'center' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 10 },
  header: { fontSize: 24, fontWeight: '700', color: '#0D47A1' },
  subheader: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 24, marginBottom: 8 },
  noDataText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16, fontStyle: 'italic' },
  tabContainer: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#E0E0E0', borderRadius: 8, padding: 2 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2 },
  tabText: { fontWeight: '600', color: '#666' },
  activeTabText: { color: '#0D47A1' },
  filterGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  flexItem: { flex: 1, marginHorizontal: 4 },
});

export const pickerStyles = StyleSheet.create({
  section: { marginTop: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#0D47A1', marginBottom: 6, marginLeft: 4 },
  pickerContainer: { borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B0BEC5', overflow: 'hidden', elevation: 1 },
  picker: { height: 48, color: '#0D47A1' },
});

export const matrixStyles = StyleSheet.create({
  tableWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 15,
    marginBottom: 20,
    flex: 1,
  },
  // --- BLOQUE FIJO IZQUIERDO ---
  leftFixedColumn: {
    width: 110,
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    overflow: 'hidden',
  },
  leftHeaderBox: {
    backgroundColor: '#0D47A1',
    height: 44,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  headerAthleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  leftRowBox: {
    height: 48,
    justifyContent: 'center',
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  athleteNameText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  // --- BLOQUE SCROLLABLE DINÁMICO DERECHO ---
  rightScrollableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopRightRadius: 8,
  },
  rightHeaderDatesBox: {
    flexDirection: 'row',
    backgroundColor: '#0D47A1',
    height: 44,
    alignItems: 'center',
  },
  columnHeaderDateText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
    width: 55, // Ancho rígido por fecha idéntico al de abajo
    textAlign: 'center',
  },
  rightRowCellsBox: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  cellUnit: {
    width: 55, // Cuadra milimétricamente con la anchura del texto superior de la fecha
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
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