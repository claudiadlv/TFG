import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { API_URL } from '../../config';
import { PadreStackParamList } from '../../navigation/types/types'; 
import styles from '../../styles/DetalleEntrenamiento.styles';

// IMÁGENES
import imagenFisico from '../../img/gym.png';
import imagenPista from '../../img/juandelcampo.jpg';
import imagenCarrera from '../../img/carrera.jpg';

// --- FUNCIONES DE APOYO ---
const getImagenFondo = (tipo: string) => {
  switch (tipo) {
    case 'Físico': return imagenFisico;
    case 'Pista':  return imagenPista;
    case 'Carrera':return imagenCarrera;
    default:       return imagenFisico;
  }
};

const getTituloBonito = (tipo: string) => {
  switch (tipo) {
    case 'Físico': return 'Sesión de entrenamiento físico';
    case 'Pista':  return 'Entrenamiento en pista';
    case 'Carrera':return 'Carrera';
    default:       return tipo;
  }
};

const getChipBg = (tipo: string) => {
  switch (tipo) {
    case 'Físico': return 'rgba(61,190,96,0.92)';
    case 'Pista':  return 'rgba(30,136,229,0.92)';
    case 'Carrera':return 'rgba(183,28,28,0.92)';
    default:       return 'rgba(33,33,33,0.92)';
  }
};

const formatFechaLinda = (fechaStr: string) => {
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return fechaStr;
  }
};

type Evento = {
  id: string;
  tipo: string;
  fecha: string;
  hora: string;
  categoria: string | string[];
  plazasTotales?: number;      
  plazasDisponibles?: number;  
  viaje_id?: number | null;   
  hora_salida_furgoneta?: string | null; 
};

export default function DetalleEventoPadreApuntar() {
  const route = useRoute<RouteProp<{params: {entrenamiento: Evento}}, 'params'>>();
  
  const eventoInicial = route.params.entrenamiento;
  const navigation = useNavigation<NativeStackNavigationProp<PadreStackParamList>>();

  const [evento, setEvento] = useState<Evento>(eventoInicial);
  const [hijosDisponibles, setHijosDisponibles] = useState<any[]>([]);
  const [hijosSeleccionados, setHijosSeleccionados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enFurgoneta, setEnFurgoneta] = useState(false);

  const tieneTransporte = evento?.viaje_id !== null && evento?.viaje_id !== undefined;

  useEffect(() => {
    const cargarYFiltrarHijos = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setCargando(false);
        return;
      }

      try {
        console.log(`[FRONTEND PADRE] Pidiendo detalles a: ${API_URL}/eventos/padre/evento/${eventoInicial.id}`);
        
        const resEventos = await fetch(`${API_URL}/eventos/padre/evento/${eventoInicial.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (resEventos.ok) {
          const fresco = await resEventos.json();
          console.log("=================================================");
          console.log("🔥 [AUDITORÍA FRONTEND] ¡OBJETO FRESCO RECIBIDO!");
          console.log("1. ¿Tiene viaje_id?:", fresco.viaje_id, `(Tipo: ${typeof fresco.viaje_id})`);
          console.log("2. ¿Tiene tiene_transporte?:", fresco.tiene_transporte, `(Tipo: ${typeof fresco.tiene_transporte})`);
          console.log("3. ¿Tiene hora_salida_furgoneta?:", fresco.hora_salida_furgoneta, `(Tipo: ${typeof fresco.hora_salida_furgoneta})`);
          console.log("4. Estructura completa de las llaves del JSON:", Object.keys(fresco));
          console.log("5. JSON en texto plano para verificar todo:", JSON.stringify(fresco));
          console.log("=================================================");
          setEvento(fresco); 
        }else {
          console.error(`[FRONTEND PADRE] Error en respuesta de API. Código estatus: ${resEventos.status}`);
        }

        const res = await fetchWithAuth(`${API_URL}/deportista/mis_hijos`, token);
        if (!res.ok) throw new Error("No se pudieron cargar tus hijos");
        const todosLosHijos = await res.json();

        let categoriesEvento: string[] = [];
        const catRaw = eventoInicial.categoria;
        if (Array.isArray(catRaw)) {
          categoriesEvento = catRaw;
        } else if (typeof catRaw === 'string') {
          try {
            const parsed = JSON.parse(catRaw);
            categoriesEvento = Array.isArray(parsed) ? parsed : [String(parsed)];
          } catch {
            categoriesEvento = catRaw.split(',').map(c => c.trim());
          }
        }

        const hijosPorCategoria = todosLosHijos.filter((h: any) => 
          categoriesEvento.includes(h.categoria)
        );

        const disponibles: any[] = [];
        for (const hijo of hijosPorCategoria) {
          try {
            const check = await fetchWithAuth(
              `${API_URL}/eventos/${eventoInicial.id}/apuntado?hijoId=${hijo.id}`,
              token
            );
            if (check.ok) {
              const { apuntado } = await check.json();
              if (!apuntado) {
                disponibles.push(hijo);
              }
            }
          } catch (err) {
            console.error(`Error verificando estado del hijo ${hijo.id}:`, err);
          }
        }

        setHijosDisponibles(disponibles);

        if (disponibles.length === 1) {
          setHijosSeleccionados([String(disponibles[0].id)]);
        }

      } catch (error) {
        console.error("Error en el flujo de carga de hijos:", error);
        Alert.alert("Error", "No pudimos validar la disponibilidad de tus hijos.");
      } finally {
        setCargando(false);
      }
    };

    cargarYFiltrarHijos();
  }, [eventoInicial.id, eventoInicial.categoria]);

  const toggleHijo = (id: string) => {
    setHijosSeleccionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const apuntarHijos = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token || hijosSeleccionados.length === 0) return; 

    const plazasDisponibles = evento.plazasDisponibles || 0;
    const plazasTotales = evento.plazasTotales || 0;

    if (enFurgoneta && hijosSeleccionados.length > plazasDisponibles) { 
      Alert.alert(
        "Furgoneta Completa", 
        `Lo sentimos, solo quedan ${plazasDisponibles} plazas libres de las ${plazasTotales} configuradas para este viaje.`
      );
      return;
    }

    try {
      const promesas = hijosSeleccionados.map(id => 
        fetchWithAuth(`${API_URL}/eventos/${evento.id}/apuntar`, token, {
          method: 'POST',
          body: JSON.stringify({ hijoId: id, enFurgoneta })
        })
      );

      const resultados = await Promise.all(promesas);

      if (resultados.every(r => r.ok)) { 
        Alert.alert('¡Éxito!', 'Inscripción realizada correctamente.', [
          { text: 'OK', onPress: () => navigation.navigate('InicioPadre', { screen: 'INICIO' } as any) },
        ]);
      } else {
        Alert.alert('Aviso', 'El cupo de la furgoneta se ha completado.'); 
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    }
  };

  if (cargando) return <ActivityIndicator size="large" style={{ marginTop: 40 }} color="#0D47A1" />;

  const horaFurgonetaLimpia = evento?.hora_salida_furgoneta 
    ? String(evento.hora_salida_furgoneta).slice(0, 5) 
    : '07:30';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ImageBackground source={getImagenFondo(evento.tipo)} style={styles.header}>
        <View style={headerStyles.overlay}>
          <Text style={[headerStyles.pill, { backgroundColor: getChipBg(evento.tipo) }]}>
            {getTituloBonito(evento.tipo)}
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.info}>
        <Text style={styles.label}>Fecha: <Text style={styles.valor}>{formatFechaLinda(evento.fecha)}</Text></Text>
        <Text style={styles.label}>Hora Entrenamiento: <Text style={styles.valor}>{(evento.hora || '').slice(0, 5)} h</Text></Text>
      </View>
      
      {tieneTransporte && (
        <View style={customStyles.citacionBox}>
          <Icon name="time-outline" size={20} color="#0D47A1" />
          <View style={{ flex: 1 }}>
            <Text style={customStyles.citacionLabel}>
              Citación furgoneta: <Text style={customStyles.citacionValor}>{horaFurgonetaLimpia} h</Text>
            </Text>
          </View>
        </View>
      )}

      <View style={multiSelectStyles.section}>
        <Text style={multiSelectStyles.title}>Gestionar inscripción de:</Text>
        
        {hijosDisponibles.length > 0 ? (
          <View style={multiSelectStyles.list}>
            {hijosDisponibles.map((h) => {
              const isSel = hijosSeleccionados.includes(String(h.id));
              return (
                <TouchableOpacity
                  key={h.id}
                  onPress={() => toggleHijo(String(h.id))}
                  style={[multiSelectStyles.card, isSel && multiSelectStyles.cardSelected]}
                >
                  <Text style={[multiSelectStyles.name, isSel && multiSelectStyles.nameSelected]}>
                    {h.nombre}
                  </Text>
                  {isSel && <Text style={multiSelectStyles.check}> ✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={multiSelectStyles.emptyBox}>
            <Text style={multiSelectStyles.emptyText}>
              Ya has apuntado a todos tus hijos posibles para este entrenamiento.
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
              <Text style={{ color: '#0D47A1', fontWeight: 'bold' }}>Volver al calendario</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {hijosDisponibles.length > 0 && (
        <>
          {tieneTransporte ? (
            <View style={transportStyles.container}>
              <View style={transportStyles.textContainer}>
                <Text style={transportStyles.label}>Solicitar plaza en furgoneta</Text>
                <Text style={transportStyles.subLabel}>Plazas disponibles: {evento.plazasDisponibles || 0}</Text>
              </View>
              <Switch
                trackColor={{ false: "#767577", true: "#90CAF9" }}
                thumbColor={enFurgoneta ? "#0D47A1" : "#f4f3f4"}
                onValueChange={setEnFurgoneta}
                value={enFurgoneta}
              />
            </View>
          ) : (
            <View style={[transportStyles.container, { backgroundColor: '#F5F5F5', justifyContent: 'center' }]}>
              <Text style={[transportStyles.label, { color: '#757575', textAlign: 'center' }]}>
                No hay servicio de furgoneta para este evento
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.botonAzul, hijosSeleccionados.length === 0 && {backgroundColor: '#ccc'}]}
            onPress={apuntarHijos}
            disabled={hijosSeleccionados.length === 0}
          >
            <Text style={styles.textoBoton}>
              {hijosSeleccionados.length > 1 ?
                `APUNTAR (${hijosSeleccionados.length})` : 'APUNTAR'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const customStyles = StyleSheet.create({
  citacionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD', 
    borderColor: '#90CAF9',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 5,
    gap: 10,
    elevation: 1,
  },
  citacionBoxInactivo: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  citacionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D47A1',
  },
  citacionValor: {
    fontWeight: '600',
    color: '#212121',
  },
});

const headerStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  pill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, color: '#fff', fontWeight: '700', fontSize: 18, elevation: 3 },
});

const multiSelectStyles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginTop: 15 },
  title: { fontSize: 13, fontWeight: '700', color: '#0D47A1', marginBottom: 10 },
  list: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#B0BEC5', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, marginRight: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  cardSelected: { backgroundColor: '#0D47A1', borderColor: '#0D47A1' },
  name: { color: '#37474F', fontWeight: '600' },
  nameSelected: { color: '#fff' },
  check: { color: '#fff', fontWeight: 'bold' },
  emptyBox: { padding: 15, backgroundColor: '#f5f5f5', borderRadius: 10, alignItems: 'center' },
  emptyText: { color: '#666', fontStyle: 'italic', textAlign: 'center' }
});

const transportStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 10, marginBottom: 20, padding: 12, backgroundColor: '#F5F5F5', borderRadius: 10 },
  textContainer: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: '#37474F' },
  subLabel: { fontSize: 12, color: '#78909C' },
});