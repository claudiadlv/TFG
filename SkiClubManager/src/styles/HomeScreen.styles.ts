import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // --- CONTENEDOR PRINCIPAL DE LA PANTALLA ---
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
    backgroundColor: 'white',
  },

  // --- CABECERA Y BUSCADOR ---
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 10,
  },

  // --- LISTADO DE EVENTOS ---
  flatListContent: {
    paddingBottom: 100,
  },

  // --- ESTRUCTURA DE LA TARJETA (CARD) ---
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- BLOQUE MODULAR DE CATEGORÍAS (MÉTODO MAP) ---
  categoriasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,          // Separa el bloque de píldoras del título del entrenamiento
    marginBottom: 4,       // Separa el bloque de píldoras de la fecha inferior
  },
  categoriaChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12, // Aire interno a los lados del texto para darle forma ovalada
    paddingVertical: 4,    // Aire interno arriba y abajo del texto
    borderRadius: 20,      // Curvatura perfecta para simular una cápsula circular
    alignSelf: 'flex-start',
    marginRight: 8,        // Separa un círculo del siguiente horizontalmente
    marginBottom: 6,       // Si las categorías saturan la línea y bajan, evita que se peguen verticalmente
  },
  categoriaTexto: {
    color: '#003366',
    fontWeight: 'bold',    // Texto estilizado con peso para máxima legibilidad
    fontSize: 14,
  },

  // --- PIE DE LA TARJETA ---
  cardSubtitle: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
});

export default styles;