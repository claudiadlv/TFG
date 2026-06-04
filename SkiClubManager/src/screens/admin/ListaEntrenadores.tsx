import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';
import styles from '../../styles/ListaEntrenadores.styles';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../navigation/types/types';

interface Entrenador {
  id: string;
  nombre: string;
  apellidos: string;
  correo: string;
  categoria: string;
}

export default function ListaEntrenadores() {
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();

  const fetchEntrenadores = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/admin/entrenadores`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEntrenadores(data);
      } else {
        console.log('Error al cargar entrenadores:', response.status);
      }
    } catch (error) {
      console.error('Error al cargar entrenadores:', error);
    }
  };

  // Mantenemos el useEffect para la carga inicial de montaje
  useEffect(() => {
    fetchEntrenadores();
  }, []);

  // Hook estratégico: Se dispara automáticamente cada vez que la pantalla vuelve al primer plano
  useFocusEffect(
    useCallback(() => {
      fetchEntrenadores();
    }, [])
  );

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar este entrenador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('accessToken');
              const response = await fetch(`${API_URL}/admin/entrenadores/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              if (response.ok) {
                Alert.alert('Éxito', 'Entrenador eliminado.');
                fetchEntrenadores();
              } else {
                console.log('Error al eliminar:', response.status);
                Alert.alert('Error', 'No se pudo eliminar el entrenador.');
              }
            } catch (error) {
              console.error('Error al eliminar entrenador:', error);
              Alert.alert('Error', 'Error de conexión.');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEntrenadores();
    setRefreshing(false);
  };

  // Renderizador dinámico corregido: Limpia comillas y corchetes interpretando el formato JSON de MySQL
  const renderCategoriasBadges = (categoriaString: string) => {
    if (!categoriaString) {
      return <Text style={styles.detail}>Sin categorías</Text>;
    }

    let listaCategorias: string[] = [];

    try {
      // Si empieza con corchete, es un formato estructurado JSON: '["U14","FIS"]'
      if (typeof categoriaString === 'string' && categoriaString.startsWith('[')) {
        listaCategorias = JSON.parse(categoriaString);
      } else {
        // En caso de que quede texto plano antiguo sin parsear: "U14, FIS"
        listaCategorias = categoriaString.split(',').map(c => c.trim());
      }
    } catch (e) {
      console.error("Error al parsear las categorias de la lista:", e);
      listaCategorias = [];
    }

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, alignItems: 'center' }}>
        <Text style={[styles.detail, { marginRight: 5 }]}>Categorías:</Text>
        {listaCategorias.map((cat, index) => (
          <View
            key={`${cat}-${index}`}
            style={{
              backgroundColor: '#003366',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              marginRight: 4,
              marginBottom: 4,
            }}
          >
            <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
              {cat}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {entrenadores.map((entrenador) => (
        <View key={entrenador.id} style={styles.itemContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.name}>{entrenador.nombre} {entrenador.apellidos}</Text>
            <Text style={styles.detail}>{entrenador.correo}</Text>
            
            {/* Renderizado limpio con Badges dinámicos */}
            {renderCategoriasBadges(entrenador.categoria)}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditarEntrenador', { entrenadorId: entrenador.id })}
            >
              <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(entrenador.id)}
            >
              <Text style={styles.buttonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('AdministrarEntrenador')}
      >
        <Text style={styles.createButtonText}>Crear nuevo entrenador</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}