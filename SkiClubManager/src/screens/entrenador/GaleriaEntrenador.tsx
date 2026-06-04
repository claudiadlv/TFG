import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../../styles/GaleriaEntrenador.styles'; 
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { API_URL } from '../../config';

type Photo = {
  id: string;
  uri: string;
  fecha: string; 
  categoria: string;
};

type SectionData = {
  title: string; 
  data: Photo[][]; 
};

export default function GaleriaEntrenadorScreen() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  
  // 📥 Aquí guardaremos las categorías Reales del perfil (ej: ['U6', 'U8']) para validar la seguridad
  const [misCategoriasReales, setMisCategoriasReales] = useState<string[]>([]);
  
  // Pestañas visuales de la pantalla
  const pestañasPantalla = ['General', 'Mis Equipos'];
  const [categoriaActiva, setCategoriaActiva] = useState<string>('Mis Equipos');

  useEffect(() => {
    cargarFotosDesdeBD();
  }, []);

  // 1. CARGA DE FOTOS
  const cargarFotosDesdeBD = async () => {
    try {
      setLoading(true);
      setPhotos([]);
      const token = await AsyncStorage.getItem('accessToken'); 
      if (!token) {
        setLoading(false); 
        return;
      }

      const res = await fetch(`${API_URL}/api/fotos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const jsonResponse = await res.json();
        const fotosRaw = jsonResponse.fotos ? jsonResponse.fotos : [];
        const catsRaw = jsonResponse.categoriasVisibles ? jsonResponse.categoriasVisibles : [];

        // Guardamos las categorías limpias que el backend dice que pertenecen a este entrenador
        const catsLimpias = catsRaw.map((c: string) => c.replace(/["'\[\]]/g, '').trim());
        setMisCategoriasReales(catsLimpias);

        const fotosMapeadas = fotosRaw.map((f: any) => {
          const BlackCategorias = f.todas_categorias || f.categoria_id || '';
          return {
            id: f.id.toString(),
            uri: f.ruta,
            fecha: f.fecha_creacion || '',
            categoria: BlackCategorias ? BlackCategorias.replace(/["'\[\]]/g, '').trim() : 'General'
          };
        });
        
        setPhotos(fotosMapeadas);
      }
    } catch (err) {
      console.error('Error al conectar con el servidor:', err);
    } finally {
      setLoading(false); 
    }
  };

  // 2. SUBIDA MULTIMEDIA
  const handleAddPhoto = async () => {
    if (categoriaActiva === 'General') {
      Alert.alert(
        'Subir Imagen',
        '¿Quieres subir esta foto a la pestaña General del club?',
        [
          { text: 'Subir', onPress: () => procesarSubidaCarrete('General') },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        'Subir Imagen',
        'Las fotos se asignarán automáticamente a todas tus categorías asignadas.',
        [
          { text: 'Subir a Mis Equipos', onPress: () => procesarSubidaCarrete('') }, 
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const procesarSubidaCarrete = (categoriaAsignada: string) => {
    launchImageLibrary({ mediaType: 'photo', includeExtra: true, selectionLimit: 0 }, async (response) => {
      const assets = response?.assets;
      if (!assets || assets.length === 0) return;

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) return;

      setLoading(true);
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const uri = asset?.uri;
        if (!uri) continue;

        try {
          let fechaMetadato = '';
          if (asset && (asset as any).timestamp) {
            const fechaReal = new Date((asset as any).timestamp);
            fechaMetadato = fechaReal.toISOString().slice(0, 19).replace('T', ' ');
          } else {
            const cleanUri = uri.replace('file://', '');
            const fileStat = await RNFS.stat(cleanUri);
            const fechaAlternativa = fileStat.mtime ? new Date(fileStat.mtime) : new Date();
            fechaMetadato = fechaAlternativa.toISOString().slice(0, 19).replace('T', ' ');
          }

          await fetch(`${API_URL}/api/fotos`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
              ruta: uri, 
              fecha: fechaMetadato, 
              categoria_id: categoriaAsignada || null 
            }),
          });
        } catch (err) {
          console.log('Error en subida:', err);
        }
      }
      cargarFotosDesdeBD();
    });
  };

  // 3. ACCIONES Y ELIMINACIÓN
  const handlePhotoPress = (photoId: string, uri: string) => {
    if (selectedPhotoIds.length > 0) {
      toggleSelectPhoto(photoId);
    } else {
      Alert.alert(
        'Opciones de Foto',
        '¿Qué acción deseas realizar?',
        [
          { text: 'Descargar', onPress: () => downloadImage(uri) },
          { text: 'Eliminar', onPress: () => confirmarEliminacion([photoId]), style: 'destructive' },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    }
  };

  const toggleSelectPhoto = (photoId: string) => {
    setSelectedPhotoIds(prev => 
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  const confirmarEliminacion = (ids: string[]) => {
    Alert.alert(
      'Eliminar',
      `¿Seguro que quieres borrar estas ${ids.length} fotos?`,
      [
        { text: 'Sí, borrar', onPress: () => eliminarFotosEnLote(ids), style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const eliminarFotosEnLote = async (ids: string[]) => {
    const token = await AsyncStorage.getItem('accessToken'); 
    if (!token) return;
    
    setPhotos(prev => prev.filter(p => !ids.includes(p.id)));
    setSelectedPhotoIds([]); 

    try {
      await fetch(`${API_URL}/api/fotos`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ ids: ids }), 
      });
    } catch (err) {
      console.log('Error al eliminar:', err);
      cargarFotosDesdeBD(); 
    }
  };

  const downloadImage = async (uri: string) => {
    const filename = uri.split('/').pop();
    const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
    try {
      await RNFS.copyFile(uri, path);
      Alert.alert('Éxito', 'Imagen guardada en Descargas');
    } catch (err) {
      Alert.alert('Error', 'No se pudo exportar');
    }
  };

  const obtenerFotosUnicas = (): Photo[] => {
    const urisVistas = new Set();
    return photos.filter(photo => {
      if (!photo || !photo.uri) return false;
      const rutaLimpia = photo.uri.trim();
      if (urisVistas.has(rutaLimpia)) return false;
      urisVistas.add(rutaLimpia);
      return true;
    });
  };

  // 5. FILTRADO COMPUESTO Y BUSCADOR CRONOLÓGICO CORREGIDO
  const agruparFotosPorMes = (): SectionData[] => {
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const grupos: { [key: string]: Photo[] } = {}; // 🎯 Variable declarada en español

    const fotosUnicas = obtenerFotosUnicas();

    const fotosFiltradas = fotosUnicas.filter(photo => {
      const listaCategoriasFoto = photo.categoria.split(',').map(c => c.trim());

      if (categoriaActiva === 'General') {
        if (!listaCategoriasFoto.includes('General')) return false;
      } else {
        // 🚨 PESTAÑA "MIS EQUIPOS"
        // Ocultamos las circulares del club globales
        if (listaCategoriasFoto.length === 1 && listaCategoriasFoto.includes('General')) {
          return false;
        }

        // Comprobamos la pertenencia del entrenador
        const coincideConMisEquipos = listaCategoriasFoto.some(catFoto => {
          return misCategoriasReales.includes(catFoto);
        });

        if (!coincideConMisEquipos) {
          return false; 
        }
      }

      // 🔍 EL BUSCADOR: Validamos contra el mes y el año de la imagen
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase().trim();
      
      if (!photo.fecha) return false;
      const fechaISO = photo.fecha.replace(' ', 'T');
      const dateObj = new Date(fechaISO);
      
      let textoFechaCompleto = photo.fecha.toLowerCase(); // Incluye el formato base "2026-03-25"

      if (!isNaN(dateObj.getTime())) {
        const nombreMesStr = nombresMeses[dateObj.getMonth()].toLowerCase();
        const anioStr = dateObj.getFullYear().toString();
        // Creamos la cadena de rastreo completa: "2026-03-25 marzo 2026"
        textoFechaCompleto += ` ${nombreMesStr} ${anioStr}`;
      }

      return textoFechaCompleto.includes(query);
    });

    // Agrupamos las fotos en sus respectivas secciones mensuales
    fotosFiltradas.forEach(photo => {
      const fechaISO = photo.fecha ? photo.fecha.replace(' ', 'T') : '';
      const fechaObj = new Date(fechaISO);
      let mesAnio = 'Marzo 2026';

      if (!isNaN(fechaObj.getTime())) {
        mesAnio = `${nombresMeses[fechaObj.getMonth()]} ${fechaObj.getFullYear()}`; 
      }
      
      // 🎯 CORRECCIÓN: Cambiado 'groups' por 'grupos' para evitar el quiebre de estado
      if (!grupos[mesAnio]) grupos[mesAnio] = [];
      grupos[mesAnio].push(photo);
    });

    const mesesOrdenados = Object.keys(grupos).sort((a: string, b: string) => {
      const partesA = a.split(' ');
      const partesB = b.split(' ');
      const indexA = nombresMeses.indexOf(partesA[0]);
      const indexB = nombresMeses.indexOf(partesB[0]);
      return new Date(parseInt(partesB[1]), indexB, 1).getTime() - new Date(parseInt(partesA[1]), indexA, 1).getTime();
    });

    return mesesOrdenados.map(mesAnio => {
      const fotosDelMes = grupos[mesAnio];
      const filasDeFotos: Photo[][] = [];
      for (let i = 0; i < fotosDelMes.length; i += 2) {
        filasDeFotos.push(fotosDelMes.slice(i, i + 2));
      }
      return { title: mesAnio, data: filasDeFotos };
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  const seccionesEntrenador = agruparFotosPorMes();

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      {selectedPhotoIds.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFEBEE', padding: 12, borderRadius: 8, margin: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#C62828' }}>
            {selectedPhotoIds.length} seleccionadas
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => confirmarEliminacion(selectedPhotoIds)} style={{ marginRight: 20 }}>
              <Icon name="trash-outline" size={24} color="#C62828" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPhotoIds([])}>
              <Icon name="close-outline" size={24} color="#555" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.title}>Galería del Entrenador</Text> 
      )}

      {/* PESTAÑAS */}
      {selectedPhotoIds.length === 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', backgroundColor: '#F8F9F9', padding: 8, marginHorizontal: 15, borderRadius: 8, marginBottom: 10 }}>
          {pestañasPantalla.map((cat) => {
            const isActive = categoriaActiva === cat;
            return (
              <TouchableOpacity 
                key={cat} 
                onPress={() => { setCategoriaActiva(cat); setSelectedPhotoIds([]); }}
                style={{ paddingVertical: 6, paddingHorizontal: 16, backgroundColor: isActive ? '#2C3E50' : 'transparent', borderRadius: 20, marginRight: 8 }}
              >
                <Text style={{ color: isActive ? '#FFF' : '#7F8C8D', fontWeight: 'bold', fontSize: 13 }}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* BUSCADOR */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F3F4', borderRadius: 10, marginHorizontal: 15, paddingHorizontal: 10, marginBottom: 15 }}>
        <Icon name="search-outline" size={20} color="#7F8C8D" style={{ marginRight: 8 }} />
        <TextInput
          placeholder={`Buscar en ${categoriaActiva}...`}
          placeholderTextColor="#95A5A6"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1, height: 40, color: '#2C3E50', fontSize: 14 }}
        />
      </View>

      {/* BOTÓN FLOTANTE */}
      {selectedPhotoIds.length === 0 && (
        <TouchableOpacity style={styles.uploadButton} onPress={handleAddPhoto}>
          <Icon name="add-circle" size={50} color="#2C3E50" />
        </TouchableOpacity>
      )}

      {/* CUADRÍCULA */}
      {seccionesEntrenador.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Icon name="images-outline" size={55} color="#BDC3C7" style={{ marginBottom: 12 }} />
          <Text style={{ color: '#7F8C8D', fontSize: 14, textAlign: 'center' }}>
            No hay fotos en "{categoriaActiva}".
          </Text>
        </View>
      ) : (
        <SectionList
          sections={seccionesEntrenador}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.grid}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={{ fontSize: 17, fontWeight: 'bold', marginVertical: 10, color: '#2C3E50', marginLeft: 10 }}>
              {title}
            </Text>
          )}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 10 }}>
              {item.map((photo) => {
                const isSelected = selectedPhotoIds.includes(photo.id);
                return (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={() => handlePhotoPress(photo.id, photo.uri)}
                    onLongPress={() => toggleSelectPhoto(photo.id)} 
                    delayLongPress={250}
                    style={[
                      styles.imageContainer, 
                      { width: '45%', marginHorizontal: '2.5%' },
                      isSelected && { borderWidth: 3, borderColor: '#C62828', opacity: 0.7 }
                    ]}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.image} />
                    <Icon 
                      name={isSelected ? "checkmark-circle" : "shield-checkmark-outline"} 
                      size={isSelected ? 22 : 16} 
                      color={isSelected ? "#C62828" : "#34495E"} 
                      style={styles.cloudIcon} 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      )}
    </View>
  );
}