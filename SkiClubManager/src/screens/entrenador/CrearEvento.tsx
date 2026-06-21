import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EntrenadorStackParamList } from '../../navigation/types/types';
import styles from '../../styles/CrearEvento.styles';
import { API_URL } from '../../config';
import { TIPOS_ENTRENAMIENTO, DISCIPLINAS } from '../../constantes/Entrenamientos';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIAS_ESQUI } from '../../constantes/Categorias';

type RepeatMode = 'unico' | 'diario' | 'semanal';

export default function CrearEvento() {
  const navigation = useNavigation<NativeStackNavigationProp<EntrenadorStackParamList>>();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tipoEntrenamiento, setTipoEntrenamiento] = useState('Físico');
  const [categoriasEntrenadas, setCategoriasEntrenadas] = useState<string[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [disciplina, setDisciplina] = useState('');
  const [nombreCarrera, setNombreCarrera] = useState('');
  const [loading, setLoading] = useState(true);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('unico');
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set([1,2,3,4,5]));
  const [conTransporte, setConTransporte] = useState(false);
  const [plazasTransporte, setPlazasTransporte] = useState('8');

  const [horaFurgoneta, setHoraFurgoneta] = useState(new Date());
  const [showFurgonetaTimePicker, setShowFurgonetaTimePicker] = useState(false);

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) setDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleEndDateChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) setEndDate(selectedDate);
    setShowEndDatePicker(false);
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    if (selectedTime) {
      const d = new Date(date);
      d.setHours(selectedTime.getHours());
      d.setMinutes(selectedTime.getMinutes());
      d.setSeconds(0);
      d.setMilliseconds(0);
      setDate(d);
    }
    setShowTimePicker(false);
  };

  const handleFurgonetaTimeChange = (_event: any, selectedTime?: Date) => {
    if (selectedTime) {
      const d = new Date(horaFurgoneta);
      d.setHours(selectedTime.getHours());
      d.setMinutes(selectedTime.getMinutes());
      d.setSeconds(0);
      d.setMilliseconds(0);
      setHoraFurgoneta(d);
    }
    setShowFurgonetaTimePicker(false);
  };

  useEffect(() => {
    if ((tipoEntrenamiento === 'Pista' || tipoEntrenamiento === 'Carrera') && !disciplina) {
      setDisciplina('SL');
    } else if (tipoEntrenamiento === 'Físico') {
      setDisciplina('');
    }
  }, [tipoEntrenamiento]);

  useEffect(() => {
    setCategoriasEntrenadas(CATEGORIAS_ESQUI);
    setLoading(false);
  }, []);

  const normalizeYMD = (d: Date) => {
    const nd = new Date(d);
    nd.setHours(0,0,0,0);
    return nd;
  };

  const getDailyDates = (start: Date, end: Date) => {
    const out: Date[] = [];
    let cur = normalizeYMD(start);
    const last = normalizeYMD(end);
    while (cur <= last) {
      out.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };

  const getWeeklyDates = (start: Date, end: Date, days: Set<number>) => {
    const out: Date[] = [];
    let cur = normalizeYMD(start);
    const last = normalizeYMD(end);
    while (cur <= last) {
      if (days.has(cur.getDay())) out.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };

  const fechasGeneradas = useMemo(() => {
    if (!repeatEnabled || repeatMode === 'unico') return [normalizeYMD(date)];
    const fin = normalizeYMD(endDate) < normalizeYMD(date) ? normalizeYMD(date) : normalizeYMD(endDate);
    if (repeatMode === 'diario') return getDailyDates(date, fin);
    return getWeeklyDates(date, fin, weekdays);
  }, [repeatEnabled, repeatMode, date, endDate, weekdays]);

  const handleCrearEvento = async () => {
    if (categoriasSeleccionadas.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos una categoría');
      return;
    }
    if (repeatEnabled && repeatMode !== 'unico' && normalizeYMD(endDate) < normalizeYMD(date)) {
      Alert.alert('Error', 'La fecha fin no puede ser anterior a la fecha de inicio');
      return;
    }

    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      Alert.alert('Sesión', 'No se encontró un token de acceso');
      return;
    }

    const hora = date.toTimeString().split(' ')[0].slice(0, 5);
    
    const horaSalidaFurgoneta = horaFurgoneta.toTimeString().split(' ')[0].slice(0, 5);

    const eventos = fechasGeneradas.map(f => {
      const anio = f.getFullYear();
      const mes = String(f.getMonth() + 1).padStart(2, '0');
      const dia = String(f.getDate()).padStart(2, '0');
        
      const fechaLocal = `${anio}-${mes}-${dia}`;
        
      return {
        fecha: fechaLocal,
        hora,
        tipo: tipoEntrenamiento,
        categoria: categoriasSeleccionadas,
        disciplina: (tipoEntrenamiento === 'Pista' || tipoEntrenamiento === 'Carrera') ? disciplina : null,
        nombreCarrera: tipoEntrenamiento === 'Carrera' ? nombreCarrera : null,
        conTransporte: conTransporte,
        plazasTransporte: conTransporte ? parseInt(plazasTransporte) : 0,
        hora_salida_furgoneta: conTransporte ? horaSalidaFurgoneta : null
      };
    });

    try {
      const results = await Promise.allSettled(
        eventos.map(ev =>
          fetch(`${API_URL}/eventos`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(ev),
          })
        )
      );

      const ok = await Promise.all(
        results.map(async r => {
          if (r.status === 'fulfilled') {
            const res = r.value;
            if (res.status === 201) return true;
          }
          return false;
        })
      );

      const creados = ok.filter(Boolean).length;
      const total = eventos.length;

      if (creados === total) {
        navigation.navigate('EventoCreado', { tipo: total > 1 ? 'multiples' : 'creado' });
      } else if (creados > 0) {
        Alert.alert('Parcial', `Se crearon ${creados} de ${total} eventos`);
      } else {
        Alert.alert('Error', 'No se pudo crear ningún evento');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor');
      console.error('Error al crear eventos:', error);
    }
  };

  const fechaFormateada = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  const horaFormateada = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  
  const horaFurgonetaFormateada = horaFurgoneta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  
  const fechaFinFormateada = `${endDate.getDate()}/${endDate.getMonth() + 1}/${endDate.getFullYear()}`;
  const diasLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#003366" />
        <Text>Cargando categorías...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear evento</Text>

      <Text style={styles.label}>Día del entrenamiento:</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dropdownText}>{fechaFormateada}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <Text style={styles.label}>Tipo de entrenamiento:</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={tipoEntrenamiento} onValueChange={setTipoEntrenamiento} style={styles.picker}>
          {TIPOS_ENTRENAMIENTO.map((tipo) => (
            <Picker.Item key={tipo.value} label={tipo.label} value={tipo.value} />
          ))}
        </Picker>
      </View>

      {(tipoEntrenamiento === 'Pista' || tipoEntrenamiento === 'Carrera') && (
        <>
          <Text style={styles.label}>Disciplina:</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={disciplina} onValueChange={setDisciplina} style={styles.picker}>
              {DISCIPLINAS.map((disc) => (
                <Picker.Item key={disc.value} label={disc.label} value={disc.value} />
              ))}
            </Picker>
          </View>
        </>
      )}

      {tipoEntrenamiento === 'Carrera' && (
        <>
          <Text style={styles.label}>Nombre de la carrera:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Campeonato provincial"
            value={nombreCarrera}
            onChangeText={setNombreCarrera}
          />
        </>
      )}

      <Text style={styles.label}>Categorías:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {categoriasEntrenadas.map((cat) => {
          const seleccionada = categoriasSeleccionadas.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => {
                if (seleccionada) {
                  setCategoriasSeleccionadas(prev => prev.filter(c => c !== cat));
                } else {
                  setCategoriasSeleccionadas(prev => [...prev, cat]);
                }
              }}
              style={{
                backgroundColor: seleccionada ? '#003366' : '#ccc',
                padding: 8,
                margin: 5,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: seleccionada ? 'white' : 'black' }}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ 
          marginTop: 20, 
          padding: 15, 
          borderRadius: 12, 
          backgroundColor: conTransporte ? '#E3F2FD' : '#F5F5F5',
          borderWidth: 1,
          borderColor: conTransporte ? '#2196F3' : '#E0E0E0' 
      }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>🚐 Logística de Furgoneta</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Habilitar reserva de plazas para este evento</Text>
              </View>
              <Switch 
                  value={conTransporte} 
                  onValueChange={setConTransporte}
                  trackColor={{ false: "#767577", true: "#003366" }}
              />
          </View>

          {conTransporte && (
              <View style={{ marginTop: 15 }}>
                  <Text style={styles.label}>Número de plazas disponibles:</Text>
                  <TextInput
                      style={[styles.input, { backgroundColor: 'white', marginBottom: 15 }]}
                      keyboardType="numeric"
                      value={plazasTransporte}
                      onChangeText={setPlazasTransporte}
                      placeholder="Ej. 9"
                  />

                  <Text style={styles.label}>Hora de partida de la furgoneta:</Text>
                  <TouchableOpacity style={[styles.dropdown, { backgroundColor: 'white' }]} onPress={() => setShowFurgonetaTimePicker(true)}>
                      <Text style={styles.dropdownText}>{horaFurgonetaFormateada}</Text>
                  </TouchableOpacity>
                  {showFurgonetaTimePicker && (
                      <DateTimePicker
                          value={horaFurgoneta}
                          mode="time"
                          is24Hour={true}
                          display="default"
                          onChange={handleFurgonetaTimeChange}
                      />
                  )}
              </View>
          )}
      </View>
        
      <View style={{ height: 20 }} />

      <View style={{ marginTop: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.label}>Repetir</Text>
          <Switch value={repeatEnabled} onValueChange={setRepeatEnabled} />
        </View>

        {repeatEnabled && (
          <>
            <Text style={styles.label}>Modo de repetición:</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={repeatMode} onValueChange={(v) => setRepeatMode(v as RepeatMode)} style={styles.picker}>
                <Picker.Item label="Único" value="unico" />
                <Picker.Item label="Diario" value="diario" />
                <Picker.Item label="Semanal" value="semanal" />
              </Picker>
            </View>

            {repeatMode !== 'unico' && (
              <>
                <Text style={styles.label}>Fecha fin:</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowEndDatePicker(true)}>
                  <Text style={styles.dropdownText}>{fechaFinFormateada}</Text>
                </TouchableOpacity>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={handleEndDateChange}
                  />
                )}
              </>
            )}

            {repeatMode === 'semanal' && (
              <>
                <Text style={styles.label}>Días de la semana:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {diasLabels.map((lbl, idx) => {
                    const selected = weekdays.has(idx);
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => {
                          setWeekdays(prev => {
                            const next = new Set(prev);
                            if (next.has(idx)) next.delete(idx);
                            else next.add(idx);
                            return next;
                          });
                        }}
                        style={{
                          backgroundColor: selected ? '#003366' : '#ccc',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          margin: 5,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: selected ? 'white' : 'black' }}>{lbl}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 14, color: '#374151' }}>
                Se crearán {fechasGeneradas.length} evento(s)
              </Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.label}>Hora del entrenamiento:</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.dropdownText}>{horaFormateada}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleCrearEvento}>
        <Text style={styles.buttonText}>Crear evento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}