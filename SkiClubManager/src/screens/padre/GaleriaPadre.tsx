import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from '../../styles/GaleriaEntrenador.styles'; 
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

const NOMBRES_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export default function GaleriaPadreScreen() {
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]); 

  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<string>('General');

  useEffect(() => {
    cargarFotosDesdeBD();
  }, []);

  const cargarFotosDesdeBD = async () => {
    try {
      setLoading(true);
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

        //Limpiamos las comillas de las categorías de los hijos
        const catsHijosLimpias = catsRaw.map((c: string) => c.replace(/["']/g, '').trim());

        //Definimos el orden estricto del club (de más pequeña a más grande)
        const ordenClub = ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'FIS'];

        //Ordenamos las categorías del hijo basándonos en el patrón del club
        const catsHijosOrdenadas = catsHijosLimpias.sort((a: any, b: any) => {
          return ordenClub.indexOf(a) - ordenClub.indexOf(b);
        });

        //Juntamos forzando 'General' SIEMPRE en la primera posición
        const pestañasFinalesPadre = ['General', ...catsHijosOrdenadas];

        //Mapeamos las fotos para leer 'todas_categorias' o 'categoria_id'
        const fotosMapeadas = fotosRaw.map((f: any) => {
          const categoriasEnBruto = f.todas_categorias || f.categoria_id || '';
          return {
            id: f.id.toString(),
            uri: f.ruta,
            fecha: f.fecha_creacion || '',
            categoria: categoriasEnBruto ? categoriasEnBruto.replace(/["'\[\]]/g, '').trim() : 'General'
          };
        });

        //Guardamos en los estados del Padre
        setCategoriasDisponibles(pestañasFinalesPadre);
        setAllPhotos(fotosMapeadas);

        // Seguridad: Si por lo que sea 'General' no estuviera, inicializa en la primera pestaña real
        if (pestañasFinalesPadre.length > 0 && !pestañasFinalesPadre.includes(categoriaActiva)) {
          setCategoriaActiva(pestañasFinalesPadre[0]);
        }
      }
    } catch (err) {
      console.log('Error al conectar con el servidor:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoPress = (photoId: string, uri: string) => {
    if (selectedPhotoIds.length > 0) {
      toggleSelectPhoto(photoId);
    } else {
      Alert.alert(
        'Opciones de Imagen',
        '¿Quieres descargar esta foto a tu teléfono?',
        [
          { text: 'Descargar', onPress: () => downloadImage(uri) },
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

  const descargarFotosEnLote = async () => {
    const fotosADescargar = allPhotos.filter(p => selectedPhotoIds.includes(p.id));
    let errores = 0;

    for (const foto of fotosADescargar) {
      if (!foto.uri) { errores++; continue; }
      try {
        const filename = foto.uri.split('/').pop();
        const path = `${RNFS.DownloadDirectoryPath}/Club_${filename}`;
        await RNFS.copyFile(foto.uri, path);
      } catch (err) {
        errores++;
      }
    }

    if (errores === 0) {
      Alert.alert('Éxito', `¡Se han guardado las ${selectedPhotoIds.length} fotos en tu carpeta de Descargas!`);
    } else {
      Alert.alert('Descarga completada', 'Proceso de guardado en lote finalizado.');
    }
    setSelectedPhotoIds([]); 
  };

  const downloadImage = async (uri: string) => {
    if (!uri) return;
    const filename = uri.split('/').pop();
    const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
    try {
      await RNFS.copyFile(uri, path);
      Alert.alert('Éxito', 'Imagen guardada con éxito en la carpeta de Descargas.');
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar el archivo.');
    }
  };

  //Filtro antiduplicados
  const obtenerFotosUnicas = (): Photo[] => {
    const urisVistas = new Set();
    return allPhotos.filter(photo => {
      if (!photo || !photo.uri) return false;
      const rutaLimpia = photo.uri.trim();
      if (urisVistas.has(rutaLimpia)) return false;
      urisVistas.add(rutaLimpia);
      return true;
    });
  };

  //Filtrado y agrupacón
  const agruparFotosPorMes = (): SectionData[] => {
    const grupos: { [key: string]: Photo[] } = {};
    const query = searchQuery.toLowerCase().trim();

    const fotosUnicas = obtenerFotosUnicas();

    const fotosFiltradas = fotosUnicas.filter(photo => {
      const listaCategoriasFoto = photo.categoria.split(',').map(c => c.trim());

      if (categoriaActiva === 'General') {
        if (!listaCategoriasFoto.includes('General')) {
          return false;
        }
      } else {
        if (!listaCategoriasFoto.includes(categoriaActiva)) {
          return false;
        }
      }

      if (!query) return true;

      if (!photo.fecha) return false;
      const fechaISO = photo.fecha.replace(' ', 'T');
      const dateObj = new Date(fechaISO);

      let textoFechaCompleto = photo.fecha.toLowerCase(); 

      if (!isNaN(dateObj.getTime())) {
        const nombreMes = NOMBRES_MESES[dateObj.getMonth()];
        const anio = dateObj.getFullYear().toString();
        textoFechaCompleto += ` ${nombreMes} ${anio}`;
      }

      return textoFechaCompleto.includes(query);
    });

    // Agrupamos las fotos filtradas en sus secciones visuales correspondientes
    fotosFiltradas.forEach(photo => {
      const fechaFormateadaISO = photo.fecha ? photo.fecha.replace(' ', 'T') : '';
      const fecha = new Date(fechaFormateadaISO);
      let mesAnio = 'Marzo 2026';

      if (!isNaN(fecha.getTime())) {
        const nombreMesMayuscula = NOMBRES_MESES[fecha.getMonth()].charAt(0).toUpperCase() + NOMBRES_MESES[fecha.getMonth()].slice(1);
        mesAnio = `${nombreMesMayuscula} ${fecha.getFullYear()}`; 
      }
      
      if (!grupos[mesAnio]) grupos[mesAnio] = [];
      grupos[mesAnio].push(photo);
    });

    const mesesOrdenados = Object.keys(grupos).sort((a: string, b: string) => {
      const partesA = a.split(' ');
      const partesB = b.split(' ');
      const indexA = NOMBRES_MESES.indexOf(partesA[0].toLowerCase());
      const indexB = NOMBRES_MESES.indexOf(partesB[0].toLowerCase());
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

  const secciones = agruparFotosPorMes();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {selectedPhotoIds.length > 0 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E1F5FE', padding: 12, borderRadius: 8, margin: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0288D1' }}>
            {selectedPhotoIds.length} seleccionadas para descargar
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={descargarFotosEnLote} style={{ marginRight: 20 }}>
              <Icon name="download-outline" size={24} color="#0288D1" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedPhotoIds([])}>
              <Icon name="close-outline" size={24} color="#555" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.title}>Galería del Equipo</Text>
      )}

      {selectedPhotoIds.length === 0 && categoriasDisponibles.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', flexWrap: 'wrap', backgroundColor: '#F8F9F9', padding: 8, marginHorizontal: 15, borderRadius: 8, marginBottom: 10 }}>
          {categoriasDisponibles.map((cat, index) => {
            const isActive = categoriaActiva === cat;
            const uniqueKey = `${cat}-${index}`; 
            
            return (
              <TouchableOpacity 
                key={uniqueKey} 
                onPress={() => { setCategoriaActiva(cat); setSelectedPhotoIds([]); }}
                style={{ paddingVertical: 6, paddingHorizontal: 16, backgroundColor: isActive ? '#1E88E5' : 'transparent', borderRadius: 20, marginBottom: 4, marginRight: 4 }}
              >
                <Text style={{ color: isActive ? '#FFF' : '#7F8C8D', fontWeight: 'bold', fontSize: 14 }}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F3F4', borderRadius: 10, marginHorizontal: 15, paddingHorizontal: 10, marginBottom: 15 }}>
        <Icon name="search-outline" size={20} color="#7F8C8D" style={{ marginRight: 8 }} />
        <TextInput
          placeholder={categoriaActiva ? `Buscar por mes o año en ${categoriaActiva}...` : "Buscar recuerdos..."}
          placeholderTextColor="#95A5A6"
          value={searchQuery}
          onChangeText={setSearchQuery} 
          style={{ flex: 1, height: 40, color: '#2C3E50', fontSize: 14 }}
          autoCorrect={false} 
          autoCapitalize="none"
        />
      </View>

      {secciones.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Icon name="images-outline" size={55} color="#BDC3C7" style={{ marginBottom: 12 }} />
          <Text style={{ color: '#7F8C8D', fontSize: 15, textAlign: 'center', fontWeight: '500' }}>
            {searchQuery ? "No hay recuerdos que coincidan con la búsqueda." : `El entrenador aún no ha subido recuerdos para la categoría "${categoriaActiva}".`}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={secciones}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.grid}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 12, color: '#2C3E50', marginLeft: 10 }}>
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
                      isSelected && { borderWidth: 3, borderColor: '#1E88E5', opacity: 0.7 }
                    ]}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.image} />
                    <Icon 
                      name={isSelected ? "checkmark-circle" : "cloud-done-outline"} 
                      size={isSelected ? 22 : 16} 
                      color={isSelected ? "#1E88E5" : "#2ECC71"} 
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