import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    height: 160,
    width: '100%',
    justifyContent: 'center',     // Centra verticalmente
    alignItems: 'center',         // Centra horizontalmente
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Mejora contraste
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    textAlign: 'center',
  },  
  info: {
    padding: 20,
    gap: 10,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  valor: {
    fontWeight: 'normal',
    color: '#555',
  },
  button: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonAzul: {
    backgroundColor: '#1E88E5',
  },
  botonRojo: {
    backgroundColor: '#E53935',
  },
  textoBoton: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
