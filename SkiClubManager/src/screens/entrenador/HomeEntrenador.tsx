import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../../styles/HomeScreen.styles';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';
import { EntrenadorStackParamList } from '../../navigation/types/types';

type Evento = {
  id: string;
  tipo: string;
  fecha: string;
  hora: string;
  categoria: any;
  disciplina?: string;
  nombreCarrera?: string;
};

type Indexado = {
  evento: Evento;
  keywords: string;
};

const normalizar = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const SINONIMOS_TIPO: Record<string, string[]> = {
  fisico: ['fisico', 'gimnasio', 'gym', 'preparacion', 'prep'],
  pista: ['pista', 'entreno', 'entrenamiento', 'series', 'tecnica'],
  carrera: ['carrera', 'competencia', 'competicion', 'race']
};

const SINONIMOS_DISC: Record<string, string[]> = {
  sl: ['sl', 'slalom', 'slalom especial'],
  gs: ['gs', 'gigante'],
  sg: ['sg', 'superg', 'super g', 'supergigante', 'super gigante']
};

const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const dias = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

const tokensDeFecha = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return [];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const nombreMes = meses[d.getMonth()];
  const nombreDia = dias[d.getDay()];
  return [
    `${dd}/${mm}/${yyyy}`,
    `${dd}/${mm}`,
    `${dd}-${mm}-${yyyy}`,
    `${dd}-${mm}`,
    `${yyyy}-${mm}-${dd}`,
    `${dd}`,
    nombreMes,
    nombreDia
  ].map(normalizar);
};

const expandirSinonimos = (palabras: string[], mapa: Record<string, string[]>) => {
  const set = new Set<string>();
  palabras.forEach(p => {
    set.add(p);
    Object.values(mapa).forEach(lista => {
      if (lista.includes(p)) lista.forEach(x => set.add(x));
    });
  });
  return Array.from(set);
};

export default function HomeEntrenador() {
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<EntrenadorStackParamList>>();

  const cargarEventos = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setEventos([]);
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${API_URL}/eventos/entrenador/mios`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Respuesta no OK:', res.status, text);
        setEventos([]);
        return;
      }
      
      const data: Evento[] = await res.json();
      
      const normalizados = data.map((e) => {
        let categoria = e.categoria;
        if (typeof categoria === 'string') {
          try {
            const parsed = JSON.parse(categoria);
            if (Array.isArray(parsed)) categoria = parsed;
          } catch {}
        }
        return { ...e, categoria };
      });

      const hoy = new Date(); 
      hoy.setHours(0,0,0,0);
      const eventosValidos = normalizados
        .filter((evento) => {
          const d = new Date(evento.fecha); 
          d.setHours(0,0,0,0);
          return d.getTime() >= hoy.getTime();
        })
        .sort((a, b) => {
          const fechaA = new Date(a.fecha);
          const fechaB = new Date(b.fecha);
          return fechaA.getTime() - fechaB.getTime();
        });

      setEventos(eventosValidos);
    } catch (error) {
      console.error('Error al cargar eventos entrenador:', error);
      setEventos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarEventos();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarEventos();
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setBusquedaDebounced(busqueda), 200);
    return () => clearTimeout(id);
  }, [busqueda]);

  const indice = useMemo<Indexado[]>(() => {
    return eventos.map(e => {
      const tipo = normalizar(e.tipo || '');
      const disciplina = normalizar(e.disciplina || '');
      const nombreCarrera = normalizar(e.nombreCarrera || '');
      const cats = Array.isArray(e.categoria) ? e.categoria.join(', ') : e.categoria || '';
      const categoria = normalizar(cats);
      const fechaTokens = tokensDeFecha(e.fecha);
      const tipoExpanded = expandirSinonimos([tipo], SINONIMOS_TIPO).join(' ');
      const discExpanded = disciplina
        ? expandirSinonimos([disciplina], SINONIMOS_DISC).join(' ')
        : '';
      const keywords = [
        tipo,
        tipoExpanded,
        categoria,
        disciplina,
        discExpanded,
        nombreCarrera,
        fechaTokens.join(' ')
      ].join(' ');
      return { evento: e, keywords };
    });
  }, [eventos]);

  const eventosFiltrados = useMemo(() => {
    const q = normalizar(busquedaDebounced).trim();
    if (!q) return eventos;
    const tokens = q.split(/\s+/).filter(t => t.length > 1);
    if (!tokens.length) return eventos;
    return indice
      .filter(item => tokens.every(t => item.keywords.includes(t)))
      .map(item => item.evento);
  }, [busquedaDebounced, eventos, indice]);

  const getCardColor = (tipo: string) => {
    switch (tipo) {
      case 'Físico': return '#3DBE60';
      case 'Pista': return '#1E88E5';
      case 'Carrera': return '#B71C1C';
      default: return '#212121';
    }
  };

  const renderItem = ({ item }: { item: Evento }) => {
    const color = getCardColor(item.tipo);
    const fecha = new Date(item.fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit' });
    const horaFormateada = item.hora.slice(0, 5);

    let titulo = '';
    if (item.tipo === 'Físico') titulo = 'Físico';
    else if (item.tipo === 'Pista') titulo = item.disciplina ? `Entrenamiento de ${item.disciplina}` : 'Entrenamiento';
    else if (item.tipo === 'Carrera') {
      titulo = `Carrera de ${item.disciplina}`;
      if (item.nombreCarrera) titulo += `: ${item.nombreCarrera}`;
    }

    // Unificamos las categorías en una sola cadena de texto separada por comas
    const categoriasUnificadas = Array.isArray(item.categoria)
      ? item.categoria.join(', ')
      : typeof item.categoria === 'string' && item.categoria.startsWith('[')
        ? JSON.parse(item.categoria).join(', ')
        : item.categoria;

    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('DetalleEntrenamiento' as any, { entrenamiento: item } as any)}
      >
        <View style={[styles.card, { backgroundColor: color }]}>
          <Text style={styles.cardTitle}>{titulo}</Text>
          
          <View style={styles.categoriasContainer}>
            <View style={styles.categoriaChip}>
              <Text style={styles.categoriaTexto}>{categoriasUnificadas}</Text>
            </View>
          </View>
          
          <Text style={styles.cardSubtitle}>
            {fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)} - {horaFormateada}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Eventos de tu categoría</Text>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" />
        <TextInput
          style={styles.input}
          placeholder="Buscar por tipo, disciplina, categoría o fecha"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
      {eventosFiltrados.length === 0 ? (
        <Text style={{ padding: 16, color: '#666' }}>No hay eventos que coincidan.</Text>
      ) : (
        <FlatList
          data={eventosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}