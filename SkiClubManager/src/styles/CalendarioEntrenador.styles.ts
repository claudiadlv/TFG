import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#d6f0f7',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  calendar: {
    borderRadius: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#003366',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  categoriaPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  categoriaPill: {
    backgroundColor: '#ffffff33',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  categoriaTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default styles;
