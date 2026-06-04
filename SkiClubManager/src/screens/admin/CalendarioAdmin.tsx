import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types/types';
import styles from '../../styles/CalendarioEntrenador.styles';
import { API_URL } from '../../config';

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
    case 'Pista':  return '#1E88E5';
    case 'Carrera':return '#B71C1C';
    default:       return '#212121';
  }
};

const parseCategoria = (c: any): string | string[] => {
  if (typeof c === 'string') {
    try {
      const parsed = JSON.parse(c);
      if (Array.isArray(parsed)) return parsed;
      return c;
    } catch {
      return c;
    }
  }
  return c;
};

export default function CalendarioAdmin() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [eventos, setEventos] = useState<{ [date: string]: Evento[] }>({});
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});

  const cargarEventos = async () => {
    try {
      const response = await fetch(`${API_URL}/eventos/todos`);
      const text = await response.text();
      const data = JSON.parse(text);

      const eventosPorFecha: { [date: string]: Evento[] } = {};
      const marcas: { [date: string]: { dots: { key: string; color: string }[]; marked: true } } = {};

      (data || []).forEach((ev: any) => {
        const d = new Date(ev.fecha);
        if (isNaN(d.getTime())) return;

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const fecha = `${yyyy}-${mm}-${dd}`;

        const nuevoEvento: Evento = {
          id: String(ev.id),
          tipo: ev.tipo,
          fecha,
          hora: ev.hora,
          categoria: parseCategoria(ev.categoria),
          disciplina: ev.disciplina,
          nombreCarrera: ev.nombreCarrera,
        };

        if (!eventosPorFecha[fecha]) eventosPorFecha[fecha] = [];
        eventosPorFecha[fecha].push(nuevoEvento);
      });

      Object.entries(eventosPorFecha).forEach(([fecha, lista]) => {
        const dots = lista.map((ev, idx) => ({
          key: `${ev.id}-${idx}`,
          color: getCardColor(ev.tipo),
        }));
        marcas[fecha] = { dots, marked: true };
      });

      setEventos(eventosPorFecha);
      setMarkedDates(marcas);
      setSelectedDate(today);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  useFocusEffect(useCallback(() => { cargarEventos(); }, []));

  const eventosDelDia = eventos[selectedDate] || [];
  const toArray = (cat: string | string[]) => Array.isArray(cat) ? cat : (cat ? [cat] : []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
            selectedColor: '#003366'
          }
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
            onPress={() => navigation.navigate('DetalleEntrenamiento', { entrenamiento: item as any})}
          >
            <View style={{ backgroundColor: getCardColor(item.tipo), padding: 12, margin: 10, borderRadius: 12 }}>
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

              <Text style={{ color: '#fff', marginTop: 4 }}>{(item.hora || '').slice(0, 5)}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ margin: 20, color: '#666' }}>No hay eventos para este día.</Text>
      )}
    </ScrollView>
  );
}
