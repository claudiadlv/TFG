import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  titulo: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  botones: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vacio: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },

  boton: {
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 20,
  alignItems: 'center',
  minWidth: 100,
},
botonAceptar: {
  backgroundColor: '#1E88E5',
  marginRight: 10,
},
botonRechazar: {
  backgroundColor: 'red',
},
textoBoton: {
  color: 'white',
  fontWeight: 'bold',
},

});
