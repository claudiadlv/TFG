import React, { useState, useCallback } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import styles from '../../styles/CalendarioEntrenador.styles';
import { API_URL } from '../../config';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PadreStackParamList } from '../../navigation/types/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Evento = {
  id: string;
  tipo: string;
  fecha: string;   // YYYY-MM-DD
  hora: string;    // HH:mm:ss
  categoria: string | string[];
  disciplina?: string;
  nombreCarrera?: string;
};

const getCardColor = (tipo?: string) => {
  switch (tipo) {
    case 'Físico': return '#3DBE60';
    case 'Pista': return '#1E88E5';
    case 'Carrera': return '#B71C1C';
    default: return '#212121';
  }
};

export default function CalendarioUsuario() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [eventos, setEventos] = useState<{ [date: string]: Evento[] }>({});
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<PadreStackParamList>>();

  const cargarEventosFiltrados = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) { setEventos({}); setMarkedDates({}); return; }

      // 1) Hijos del padre
      const hijosRes = await fetchWithAuth(`${API_URL}/deportista/mis_hijos`, token);
      if (!hijosRes.ok) { setEventos({}); setMarkedDates({}); return; }
      const data = await hijosRes.json();
      const hijos = Array.isArray(data) ? data : data.hijos;

      const categoriasArray: string[] = (hijos || [])
        .map((h: any) => h?.categoria)
        .filter((c: any) => typeof c === 'string' && c.trim().length > 0);

      if (categoriasArray.length === 0) { setEventos({}); setMarkedDates({}); return; }

      // 2) Eventos filtrados por categorías (sin filtrar por fecha)
      const categoriasParam = encodeURIComponent(JSON.stringify(categoriasArray));
      const eventosRes = await fetchWithAuth(`${API_URL}/eventos/filtrados?categorias=${categoriasParam}`, token);
      if (!eventosRes.ok) { setEventos({}); setMarkedDates({}); return; }
      const eventosData = await eventosRes.json();

      // 3) Agrupar por fecha (incluye pasados, presentes y futuros)
      const eventosPorFecha: { [date: string]: Evento[] } = {};
      (eventosData || []).forEach((ev: any) => {
        const f = new Date(ev.fecha);
        if (isNaN(f.getTime())) return;

        const yyyy = f.getFullYear();
        const mm = String(f.getMonth() + 1).padStart(2, '0');
        const dd = String(f.getDate()).padStart(2, '0');
        const fechaStr = `${yyyy}-${mm}-${dd}`;

        let categoria: string | string[] = ev.categoria;
        if (typeof categoria === 'string') {
          try {
            const parsed = JSON.parse(categoria);
            if (Array.isArray(parsed)) categoria = parsed;
          } catch {}
        }

        const nuevoEvento: Evento = {
          id: String(ev.id),
          tipo: ev.tipo,
          fecha: fechaStr,
          hora: ev.hora,
          categoria,
          disciplina: ev.disciplina,
          nombreCarrera: ev.nombreCarrera,
        };

        if (!eventosPorFecha[fechaStr]) eventosPorFecha[fechaStr] = [];
        eventosPorFecha[fechaStr].push(nuevoEvento);
      });

      // 4) Dots del calendario
      const marcas: { [date: string]: { dots: { key: string; color: string }[]; marked: true } } = {};
      Object.entries(eventosPorFecha).forEach(([fecha, lista]) => {
        const dots = lista.map((ev, idx) => ({ key: `${ev.id}-${idx}`, color: getCardColor(ev.tipo) }));
        marcas[fecha] = { dots, marked: true };
      });

      setEventos(eventosPorFecha);
      setMarkedDates(marcas);

      // 5) Mantener SIEMPRE la selección actual (inicialmente 'today')
      setSelectedDate(prev => prev || today);
    } catch {
      setEventos({}); setMarkedDates({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { cargarEventosFiltrados(); }, []));
  const onRefresh = useCallback(() => { setRefreshing(true); cargarEventosFiltrados(); }, []);

  const eventosDelDia = eventos[selectedDate] || [];
  const toArray = (cat: string | string[]) => Array.isArray(cat) ? cat : [cat];

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Calendario</Text>
        <Image source={require('../../img/mikaela.jpg')} style={styles.image} />
      </View>

      <Calendar
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...(markedDates[selectedDate] || {}),
            selected: true,
            selectedColor: '#003366',
          },
        }}
        markingType="multi-dot"
        onDayPress={(day) => setSelectedDate(day.dateString)}
        firstDay={1}
        theme={{ arrowColor: '#003366', todayTextColor: '#003366' }}
        style={styles.calendar}
      />

      {eventosDelDia.length > 0 ? (
        eventosDelDia.map((item, index) => (
          <TouchableOpacity
            key={`evento-${selectedDate}-${index}`}
            onPress={() => navigation.navigate('DetalleEventoPadreApuntar', { entrenamiento: item })}
          >
            <View
              style={{
                backgroundColor: getCardColor(item.tipo),
                padding: 12,
                margin: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {item.tipo === 'Físico'
                  ? 'Físico'
                  : item.tipo === 'Pista'
                  ? `Entrenamiento de ${item.disciplina}`
                  : item.tipo === 'Carrera'
                  ? `Carrera de ${item.disciplina}${item.nombreCarrera ? `: ${item.nombreCarrera}` : ''}`
                  : item.tipo}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                {toArray(item.categoria).map((cat, idx) => (
                  <View
                    key={`${item.id}-${cat}-${idx}`}
                    style={{
                      backgroundColor: '#ffffff33',
                      borderRadius: 999,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      marginRight: 6,
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>{cat}</Text>
                  </View>
                ))}
              </View>

              <Text style={{ color: '#fff', marginTop: 4 }}>
                {item.hora?.slice(0, 5)}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ margin: 20, color: '#666' }}>No hay eventos para este día.</Text>
      )}
    </ScrollView>
  );
}
