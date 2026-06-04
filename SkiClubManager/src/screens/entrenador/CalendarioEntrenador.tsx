import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EntrenadorStackParamList } from '../../navigation/types/types';
import styles from '../../styles/CalendarioEntrenador.styles';
import { API_URL } from '../../config';
import { Entrenamiento} from '../../navigation/types/entrenamiento';

const getCardColor = (tipo?: string) => {
  switch (tipo) {
    case 'Físico': return '#3DBE60';
    case 'Pista': return '#1E88E5';
    case 'Carrera': return '#B71C1C';
    default: return '#212121';
  }
};

export default function Calendario() {
  const navigation = useNavigation<NativeStackNavigationProp<EntrenadorStackParamList>>();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [eventos, setEventos] = useState<{ [date: string]: Entrenamiento[] }>({});
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});

  const cargarEventos = async () => {
    try {
      const response = await fetch(`${API_URL}/eventos/todos`);
      const text = await response.text();
      const data = JSON.parse(text);

      const eventosPorFecha: { [date: string]: Entrenamiento[] } = {};
      const marcas: { [date: string]: { dots: { key: string; color: string }[]; marked: true } } = {};

      data.forEach((evento: any) => {
        const fechaObj = new Date(evento.fecha);
        const fecha = `${fechaObj.getFullYear()}-${(fechaObj.getMonth() + 1).toString().padStart(2, '0')}-${fechaObj.getDate().toString().padStart(2, '0')}`;
        if (!fecha) return;

        const nuevoEvento: Entrenamiento = {
          id: Number(evento.id),
          tipo: evento.tipo,
          fecha,
          hora: evento.hora,
          categoria: evento.categoria,
          disciplina: evento.disciplina,
          nombreCarrera: evento.nombreCarrera,
          plazas_totales: evento.plazas_totales,
          plazas_ocupadas: evento.plazas_ocupadas,
        };

        if (!eventosPorFecha[fecha]) eventosPorFecha[fecha] = [];
        eventosPorFecha[fecha].push(nuevoEvento);
      });

      Object.entries(eventosPorFecha).forEach(([fecha, eventos]) => {
        const dots = eventos.map((ev, idx) => ({
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

  useFocusEffect(
    useCallback(() => {
      cargarEventos();
    }, [])
  );

  const eventosDelDia = eventos[selectedDate] || [];
  const toArray = (cat: string | string[]) => Array.isArray(cat) ? cat : [cat];

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
        theme={{
          arrowColor: '#003366',
          todayTextColor: '#003366',
        }}
        style={styles.calendar}
      />

      {eventosDelDia.length > 0 ? (
        eventosDelDia.map((item, index) => (
          <TouchableOpacity
            key={`evento-${selectedDate}-${index}`}
            onPress={() => navigation.navigate('DetalleEntrenamiento', { entrenamiento: item})}
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
                {(Array.isArray(item.categoria) ? item.categoria : [item.categoria]).map((cat, idx) => (
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
                {item.hora.slice(0, 5)}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ margin: 20, color: '#666' }}>No hay eventos para este día.</Text>
      )}

      <TouchableOpacity
        style={[styles.button, { marginBottom: 30 }]}
        onPress={() => navigation.navigate('CrearEvento')}
      >
        <Text style={styles.buttonText}>Crear evento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
