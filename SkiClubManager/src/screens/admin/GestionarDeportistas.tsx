import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types/types';
import { API_URL } from '../../config';
import Icon from 'react-native-vector-icons/Ionicons';

type NavigationProp = NativeStackNavigationProp<AdminStackParamList, 'GestionarDeportistas'>;

export default function GestionarDeportistas() {
  const navigation = useNavigation<NavigationProp>();
  const isFocused = useIsFocused(); // Escucha si el Administrador vuelve a esta pantalla
  
  const [deportistas, setDeportistas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpedientes = async () => {
      try {
        const response = await fetch(`${API_URL}/deportista/expedientes-completos`);
        if (response.ok) {
          const data = await response.json();
          setDeportistas(data);
        } else {
          console.log('Error al obtener expedientes:', response.status);
        }
      } catch (error) {
        console.error('Error de conexión al cargar expedientes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchExpedientes();
    }
  }, [isFocused]);

  const expedientesFiltrados = deportistas.filter(item => {
    const nombreCompletoNiño = `${item.nombre_deportista || ''} ${item.apellidos_deportista || ''}`;
    const nombreCompletoTutor = `${item.nombre_tutor || ''} ${item.apellidos_tutor || ''}`;
    const categoriaNiño = item.categoria || '';

    const cadenaObjetivo = `${nombreCompletoNiño} ${nombreCompletoTutor} ${categoriaNiño}`.toLowerCase();
    const textoBusqueda = busqueda.toLowerCase().trim();

    const cadenaSinAcentos = cadenaObjetivo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const busquedaSinAcentos = textoBusqueda.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return cadenaSinAcentos.includes(busquedaSinAcentos);
  });

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }}>
        <ActivityIndicator size="large" color="#4A56E2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, padding: 20 }}>
        
        <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 5, color: '#333' }}>
          Expedientes de Deportistas
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
          Busca por el nombre del esquiador o por su tutor legal para gestionar sus datos.
        </Text>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFF',
          borderWidth: 1,
          borderColor: '#DDD',
          borderRadius: 10,
          paddingHorizontal: 12,
          marginBottom: 20,
        }}>
          <Icon name="search-outline" size={20} color="#888" />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 8,
              fontSize: 16,
              color: '#333',
            }}
            placeholder="Buscar por esquiador, tutor o categoría..."
            placeholderTextColor="#888"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Icon name="close-circle" size={18} color="#AAA" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={expedientesFiltrados}
          keyExtractor={(item) => item.deportista_id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: '#FFF',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: '#EEF0F2',
                elevation: 1,
              }}
              onPress={() => navigation.navigate('DetallePadreHijos', { deportista: item })}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginRight: 8 }}>
                    {item.nombre_deportista} {item.apellidos_deportista}
                  </Text>
                  
                  {item.categoria && (
                    <View style={{
                      backgroundColor: '#E8EAF6',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#4A56E2' }}>
                        {item.categoria}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <Icon name="person-circle-outline" size={16} color="#666" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 13, color: '#666' }}>
                    Tutor: {item.nombre_tutor} {item.apellidos_tutor || ''}
                  </Text>
                </View>
              </View>
              
              <Icon name="chevron-forward" size={20} color="#4A56E2" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Icon name="snow-outline" size={48} color="#CCC" />
              <Text style={{ color: '#888', marginTop: 10, fontSize: 16 }}>
                No se encontraron deportistas con ese criterio
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}