import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EntrenadorStackParamList } from '../../navigation/types/types';
import styles from '../../styles/CrearEvento.styles';
import { API_URL } from '../../config';
import { CATEGORIAS_ESQUI } from '../../constantes/Categorias';
import { TIPOS_ENTRENAMIENTO, DISCIPLINAS } from '../../constantes/Entrenamientos';

type Props = {
  route: RouteProp<EntrenadorStackParamList, 'ModificarEntrenamiento'>;
};

export default function ModificarEntrenamiento({ route }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<EntrenadorStackParamList>>();
  const { entrenamiento } = route.params;

  // Utilidad para asegurar que tenemos un array de strings
  const toArray = (v: any): string[] =>
    Array.isArray(v) ? v : (v != null && v !== '' ? [String(v)] : []);

  // --- ESTADOS INICIALES ---
  const [conTransporte, setConTransporte] = useState(!!entrenamiento.viaje_id);
  const [plazasTransporte, setPlazasTransporte] = useState(String(entrenamiento.plazas_totales || '8'));
  
  // Estados para la hora de la furgoneta corregida
  const [horaFurgo, setHoraFurgo] = useState((entrenamiento as any).hora_salida_furgoneta || '08:30');
  const [showTimePickerFurgo, setShowTimePickerFurgo] = useState(false);

  const [date, setDate] = useState(() => {
    const fecha = entrenamiento.fecha;
    const hora = entrenamiento.hora;
    if (!fecha || !hora) return new Date();
    const fechaObj = new Date(fecha);
    if (!isNaN(fechaObj.getTime())) {
      try {
        const [h, m] = hora.split(':');
        fechaObj.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      } catch {}
      return fechaObj;
    }
    return new Date();
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tipoEntrenamiento, setTipoEntrenamiento] = useState(entrenamiento.tipo || 'Físico');
  const [categoriasEntrenadas, setCategoriasEntrenadas] = useState<string[]>([]);
  
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>(() => {
    try {
      return typeof entrenamiento.categoria === 'string' 
        ? JSON.parse(entrenamiento.categoria) 
        : toArray(entrenamiento.categoria);
    } catch {
      return toArray(entrenamiento.categoria);
    }
  });

  const [disciplina, setDisciplina] = useState(entrenamiento.disciplina || '');
  const [nombreCarrera, setNombreCarrera] = useState(entrenamiento.nombreCarrera || '');

  useEffect(() => {
    setCategoriasEntrenadas(CATEGORIAS_ESQUI);
  }, []);

  useEffect(() => {
    if ((tipoEntrenamiento === 'Pista' || tipoEntrenamiento === 'Carrera') && !disciplina) {
      setDisciplina('SL');
    } else if (tipoEntrenamiento === 'Físico') {
      setDisciplina('');
      setNombreCarrera('');
    }
  }, [tipoEntrenamiento]);

  const handleTimeChangeFurgo = (_event: any, selectedDate?: Date) => {
    setShowTimePickerFurgo(false);
    if (selectedDate) {
      const hrs = selectedDate.getHours().toString().padStart(2, '0');
      const mins = selectedDate.getMinutes().toString().padStart(2, '0');
      setHoraFurgo(`${hrs}:${mins}`);
    }
  };

  const handleUpdate = async () => {
    if (categoriasSeleccionadas.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos una categoría');
      return;
    }
  
    const eventoActualizado = {
      fecha: date.toISOString().split('T')[0],
      hora: date.toTimeString().split(' ')[0].slice(0, 5),
      tipo: tipoEntrenamiento,
      categoria: categoriasSeleccionadas,
      disciplina: (tipoEntrenamiento === 'Pista' || tipoEntrenamiento === 'Carrera') ? disciplina : null,
      nombreCarrera: tipoEntrenamiento === 'Carrera' ? nombreCarrera : null,
      conTransporte: conTransporte,
      plazasTransporte: parseInt(plazasTransporte) || 8,
      hora_salida_furgoneta: conTransporte ? horaFurgo : null 
    };
  
    try {
      const response = await fetch(`${API_URL}/eventos/${entrenamiento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventoActualizado),
      });

      if (response.ok) {
        Alert.alert('¡Éxito!', 'Entrenamiento actualizado correctamente.', [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.navigate('InicioEntrenador' as any); 
            } 
          },
        ]);
      } else {
        Alert.alert('Error', 'No se pudo actualizar el entrenamiento.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    }
  };

  const fechaFormateada = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  const horaFormateada = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Modificar Entrenamiento</Text>

      <Text style={styles.label}>Día del entrenamiento:</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dropdownText}>{fechaFormateada}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker 
          value={date} 
          mode="date" 
          display="default"
          onChange={(_, selected) => { 
            if (selected) setDate(selected); 
            setShowDatePicker(false); 
          }} 
        />
      )}

      <Text style={styles.label}>Tipo de entrenamiento:</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={tipoEntrenamiento} onValueChange={setTipoEntrenamiento} style={styles.picker}>
          {TIPOS_ENTRENAMIENTO.map(t => (
            <Picker.Item key={t.value} label={t.label} value={t.value} />
          ))}
        </Picker>
      </View>

      {(tipoEntrenamiento === 'Pista' || tipoEntrenamiento === 'Carrera') && (
        <>
          <Text style={styles.label}>Disciplina:</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={disciplina} onValueChange={setDisciplina} style={styles.picker}>
              {DISCIPLINAS.map(d => (
                <Picker.Item key={d.value} label={d.label} value={d.value} />
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
              onPress={() =>
                setCategoriasSeleccionadas(prev =>
                  seleccionada ? prev.filter(c => c !== cat) : [...prev, cat]
                )
              }
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

      <Text style={styles.label}>Hora del entrenamiento:</Text>
      <TouchableOpacity style={styles.dropdown} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.dropdownText}>{horaFormateada}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour
          display="default"
          onChange={(_, selected) => { 
            if (selected) setDate(selected);
            setShowTimePicker(false); 
          }}
        />
      )}

      {/* --- SECCIÓN DE LOGÍSTICA REDISEÑADA --- */}
      <View style={{ 
        marginTop: 15, 
        padding: 15, 
        borderRadius: 12, 
        backgroundColor: conTransporte ? '#f0f4f8' : '#f9f9f9',
        borderWidth: 1,
        borderColor: conTransporte ? '#003366' : '#ddd'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.label, { marginBottom: 0 }]}>🚐 Gestionar Furgoneta</Text>
          <Switch 
            value={conTransporte} 
            onValueChange={setConTransporte}
            trackColor={{ false: "#ccc", true: "#003366" }}
          />
        </View>

        {conTransporte && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 5, fontWeight: '500' }}>Plazas totales disponibles:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#fff', marginBottom: 12, height: 48 }]}
              keyboardType="numeric"
              value={plazasTransporte}
              onChangeText={setPlazasTransporte}
            />

            <Text style={{ fontSize: 13, color: '#4b5563', marginBottom: 5, fontWeight: '500' }}>Hora de salida de la furgoneta:</Text>
            <TouchableOpacity 
              style={{ 
                backgroundColor: '#fff', 
                borderWidth: 1, 
                borderColor: '#ccc', 
                borderRadius: 8, 
                height: 50, 
                justifyContent: 'center', 
                paddingHorizontal: 12,
                marginBottom: 5
              }} 
              onPress={() => setShowTimePickerFurgo(true)}
            >
              <Text style={{ fontSize: 16, color: '#333' }}>{horaFurgo} h</Text>
            </TouchableOpacity>

            {showTimePickerFurgo && (
              <DateTimePicker
                value={new Date(`2026-01-01T${horaFurgo}:00`)}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimeChangeFurgo}
              />
            )}

            <Text style={{ fontSize: 11, color: '#e63946', fontStyle: 'italic', marginTop: 8 }}>
              * Nota: Los cambios afectan a todos los grupos que compartan esta furgoneta.
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Guardar cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}