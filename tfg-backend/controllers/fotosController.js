const dbModulo = require('../db');

// Extraemos el 'promisePool' que es el que soporta async/await en mysql2
const db = dbModulo.promisePool ? dbModulo.promisePool : dbModulo;

//Guardar una nueva foto priorizando SIEMPRE la categoría seleccionada en el Frontend
const guardarFoto = async (req, res) => {
  console.log('📥 [Back] ¡Petición POST recibida en /api/fotos!');
  console.log('📥 [Back] Body recibido del Frontend:', req.body);

  const { ruta, fecha, categoria_id } = req.body;
  
  if (!ruta) {
    console.log('❌ [Back] Error: El campo "ruta" viene vacío.');
    return res.status(400).json({ error: 'El campo ruta es obligatorio.' });
  }

  const fechaFinal = fecha || new Date().toISOString().slice(0, 19).replace('T', ' ');
  const usuario_id = (req.user && req.user.id) ? req.user.id : null; 
  const usuario_rol = (req.user && req.user.rol) ? req.user.rol.toLowerCase().trim() : 'entrenador';

  try {
    if (categoria_id) {
      console.log(`[Back] Inserción quirúrgica. Guardando foto SOLO en la categoría: '${categoria_id}'`);
      
      const [result] = await db.query(
        'INSERT INTO fotos (ruta, fecha_creacion, categoria_id) VALUES (?, ?, ?)',
        [ruta, fechaFinal, categoria_id]
      );
      
      return res.status(201).json({ 
        message: `Foto guardada con éxito en la categoría ${categoria_id}`, 
        id: result.insertId,
        categoria: categoria_id 
      });
    }

    // Si sube algo y por un error técnico del cliente 'categoria_id' llegase vacío
    if (usuario_rol === 'admin') {
      console.log(`👑 [Back] Admin sin categoría especificada. Guardando en 'General' por defecto.`);
      const [result] = await db.query(
        'INSERT INTO fotos (ruta, fecha_creacion, categoria_id) VALUES (?, ?, ?)',
        [ruta, fechaFinal, 'General']
      );
      return res.status(201).json({ 
        message: 'Foto de administración guardada en General', 
        id: result.insertId,
        categoria: 'General' 
      });
    }

    // Solo actúa si el frontend NO envía ninguna categoría en el body de la petición
    console.log(`🔎 [Back] Fallback Entrenador activo (ID: ${usuario_id}). Esparciendo en todo su rango...`);
    
    const [rows] = await db.query('SELECT categoria FROM entrenador WHERE id = ?', [usuario_id]);
    
    if (rows.length === 0 || !rows[0].categoria) {
      return res.status(400).json({ error: 'Tu perfil no tiene categorías configuradas.' });
    }

    let categoriasDestino = [];
    const categoriaRaw = rows[0].categoria;

    try {
      const categoriasArray = JSON.parse(categoriaRaw); 
      if (Array.isArray(categoriasArray) && categoriasArray.length > 0) {
        categoriasDestino = categoriasArray; 
      }
    } catch (parseError) {
      const catLimpia = categoriaRaw.replace(/[^a-zA-Z0-9]/g, '').trim();
      if (catLimpia) {
        categoriasDestino = [catLimpia];
      }
    }

    if (categoriasDestino.length === 0) {
      return res.status(400).json({ error: 'Formato de categorías no válido.' });
    }

    let IDsInsertados = [];
    for (const cat of categoriasDestino) {
      const [result] = await db.query(
        'INSERT INTO fotos (ruta, fecha_creacion, categoria_id) VALUES (?, ?, ?)',
        [ruta, fechaFinal, cat]
      );
      IDsInsertados.push(result.insertId);
    }
    
    return res.status(201).json({ 
      message: 'Foto esparcida automáticamente por falta de categoría en el body', 
      ids: IDsInsertados,
      categorias: categoriasDestino 
    });

  } catch (error) {
    console.error('💥 [Back] ERROR CRÍTICO EN EL PROCESO DE GUARDADO:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el guardado.' });
  }
};

//Obtener todas las fotos ordenadas (Sin duplicados para el entrenador)
const obtenerFotos = async (req, res) => {
  console.log('[Back] ¡Petición GET recibida en /api/fotos!');
  
  try {
    const usuario_id = req.user ? req.user.id : null;
    const usuario_rol = req.user && req.user.rol ? req.user.rol.toLowerCase().trim() : '';

    if (usuario_rol === 'admin' || !req.user) { 
      console.log('📋 [Back] Perfil ADMIN. Enviando catálogo completo del club...');
      
      const [rows] = await db.query(
        `SELECT MIN(id) as id, ruta, MIN(fecha_creacion) as fecha_creacion, 
                GROUP_CONCAT(categoria_id SEPARATOR ',') as todas_categorias 
         FROM fotos 
         GROUP BY ruta 
         ORDER BY fecha_creacion DESC`
      );
      
      const listaCategoriasAdmin = ['General', 'U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'FIS'];

      return res.status(200).json({ 
        categoriasVisibles: listaCategoriasAdmin, 
        fotos: rows 
      });
    }

    if (usuario_rol === 'entrenador') {
      console.log(`📋 [Back] Perfil ENTRENADOR (ID: ${usuario_id}). Extrayendo categorías de forma estricta...`);
      
      const [entrenadorRows] = await db.query('SELECT categoria FROM entrenador WHERE id = ?', [usuario_id]);
      
      let categoriasDelEntrenador = [];
      
      if (entrenadorRows.length > 0 && entrenadorRows[0].categoria) {
        const categoriaRaw = entrenadorRows[0].categoria.trim();
        
        try {
          // Intento 1: Parsear como JSON Array válido de DBeaver
          const parsed = JSON.parse(categoriaRaw);
          if (Array.isArray(parsed)) {
            categoriasDelEntrenador = parsed.map(c => c.replace(/["'\[\]]/g, '').trim());
          }
        } catch (e) {
          console.log('[Back] No es un JSON puro. Procesando como texto plano o lista de comas...');
          // Intento 2: Limpiar corchetes/comillas y separar si vienen separados por comas (ej: U14,U16,FIS)
          let stringLimpio = categoriaRaw.replace(/["'\[\]]/g, '').trim();
          
          if (stringLimpio.includes(',')) {
            categoriasDelEntrenador = stringLimpio.split(',').map(c => c.trim()).filter(Boolean);
          } else if (stringLimpio) {
            categoriasDelEntrenador = [stringLimpio];
          }
        }
      }

      if (categoriasDelEntrenador.length === 0) {
        console.log(`[Back] Error: El entrenador ${usuario_id} no tiene categorías válidas en su celda.`);
        return res.status(400).json({ error: 'No tienes categorías asignadas en tu perfil.' });
      }

      // Traemos el tablón de fotos general con GROUP_CONCAT
      const [rows] = await db.query(
        `SELECT MIN(id) as id, ruta, MIN(fecha_creacion) as fecha_creacion, 
                GROUP_CONCAT(categoria_id SEPARATOR ',') as todas_categorias 
         FROM fotos 
         GROUP BY ruta 
         ORDER BY fecha_creacion DESC`
      );

      console.log(`🎯 [Back] Enviando pestañas estrictas al Entrenador:`, categoriasDelEntrenador);

      return res.status(200).json({ 
        categoriasVisibles: categoriasDelEntrenador, 
        fotos: rows 
      });
    }

    let listaCategoriasHijos = [];

    try {
      const [padreRow] = await db.query('SELECT id FROM padres WHERE id_usuario = ?', [usuario_id]);
      
      if (padreRow.length > 0) {
        const realPadreId = padreRow[0].id;
        console.log(`[Back] Usuario ${usuario_id} mapeado con éxito al Padre ID: ${realPadreId}`);

        const [relaciones] = await db.query('SELECT id_deportista FROM padres_hijos WHERE id_padre = ?', [realPadreId]);
        
        if (relaciones.length > 0) {
          const hijosIds = relaciones.map(r => r.id_deportista);
          console.log(`[Back] IDs de hijos encontrados:`, hijosIds);

          const [hijosRows] = await db.query('SELECT DISTINCT categoria FROM deportistas WHERE id IN (?)', [hijosIds]);
          console.log(`[Back] Categorías crudas recuperadas de DBeaver:`, hijosRows);
          
          const categoriasSet = new Set();
          
          hijosRows.forEach(h => {
            if (h.categoria) {
              let stringLimpio = h.categoria.replace(/["'\[\]]/g, '').trim();
              
              if (stringLimpio.includes(',')) {
                stringLimpio.split(',').forEach(c => {
                  if (c.trim()) categoriasSet.add(c.trim());
                });
              } else if (stringLimpio) {
                categoriasSet.add(stringLimpio);
              }
            }
          });
          
          listaCategoriasHijos = Array.from(categoriasSet).sort();
        }
      }
    } catch (errDb) {
      console.log('[Back] Error relacional con esquema DBeaver:', errDb.message);
    }

    if (listaCategoriasHijos.length === 0) {
      listaCategoriasHijos = ['U6', 'U14'];
    }

    console.log('[Back] Pestañas dinámicas finales del Padre (SIN COMILLAS):', listaCategoriasHijos);

    const [rowsFotos] = await db.query(
      `SELECT MIN(id) as id, ruta, MIN(fecha_creacion) as fecha_creacion, 
              GROUP_CONCAT(categoria_id SEPARATOR ',') as todas_categorias 
       FROM fotos 
       GROUP BY ruta 
       ORDER BY fecha_creacion DESC`
    );

    return res.status(200).json({
      categoriasVisibles: listaCategoriasHijos, 
      fotos: rowsFotos
    });

  } catch (error) {
    console.error('Error crítico global en obtenerFotos:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

//Eliminar una o varias fotos de la BD a la vez
const eliminarFoto = async (req, res) => {
  // Puede recibir un id individual por URL (/api/fotos/5) o un array por el cuerpo ({ ids: [5, 6, 7] })
  const { id } = req.params;
  const { ids } = req.body;

  try {
    let idsAEliminar = [];

    //Identificamos si es un borrado múltiple o individual
    if (ids && Array.isArray(ids)) {
      idsAEliminar = ids;
    } else if (id) {
      idsAEliminar = [id];
    }

    if (idsAEliminar.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron IDs para eliminar' });
    }

    console.log('Eliminando en lote los siguientes IDs de fotos:', idsAEliminar);

    //Buscamos las rutas en la BD antes de borrar, por si necesitas registrar logs del TFG
    const [rows] = await db.query('SELECT ruta FROM fotos WHERE id IN (?)', [idsAEliminar]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Las fotos seleccionadas no existen o ya fueron eliminadas' });
    }

    //Ejecutamos el DELETE masivo usando el operador IN (?) de MySQL
    await db.query('DELETE FROM fotos WHERE id IN (?)', [idsAEliminar]);

    res.status(200).json({ 
      message: `${idsAEliminar.length} foto(s) eliminada(s) correctamente de la base de datos con todos sus datos asociados` 
    });
  } catch (error) {
    console.error('Error al eliminar las fotos de la base de datos:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar los datos' });
  }
};


// Exportamos de forma limpia y explícita las tres funciones
module.exports = { obtenerFotos, guardarFoto, eliminarFoto };