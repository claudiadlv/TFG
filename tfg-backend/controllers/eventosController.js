const { promisePool: db } = require('../db');

/* =========================
   CREAR EVENTO
========================= */
exports.crearEvento = async (req, res) => {
  const { 
    tipo, 
    fecha, 
    hora, 
    categoria, 
    disciplina, 
    conTransporte, 
    plazasTransporte, 
    nombreCarrera,
    hora_salida_furgoneta 
  } = req.body;
  
  console.log("Datos recibidos:", { conTransporte, plazasTransporte, fecha, hora_salida_furgoneta });

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    let viajeId = null; 
    const habilitarTransporte = conTransporte === true || conTransporte === 'true';

    if (habilitarTransporte) {
      console.log("Buscando si ya existe un viaje para la fecha:", fecha);
      
      // 1. BUSCAMOS SI YA EXISTE UN VIAJE PARA ESA FECHA
      const [viajeExistente] = await connection.query(
        'SELECT id FROM transporte_viajes WHERE fecha = ? LIMIT 1', 
        [fecha]
      );

      if (viajeExistente.length > 0) {
        // 2. SI EXISTE, REUTILIZAMOS EL ID (Recurso compartido)
        viajeId = viajeExistente[0].id;
        console.log("Reutilizando viaje existente ID:", viajeId);
      } else {
        // 3. SI NO EXISTE, LO CREAMOS INYECTANDO LA HORA DE LA FURGONETA
        console.log("Creando nuevo transporte compartido con hora:", hora_salida_furgoneta);
        
        const queryNuevoViaje = `
          INSERT INTO transporte_viajes (fecha, plazas_totales, descripcion, hora_salida_furgoneta) 
          VALUES (?, ?, ?, ?)
        `;
        const [nuevoViaje] = await connection.query(queryNuevoViaje, [
          fecha, 
          Number(plazasTransporte) || 8, 
          `Viaje compartido - ${fecha}`,
          hora_salida_furgoneta || null 
        ]);
        viajeId = nuevoViaje.insertId;
        console.log("Nuevo viaje creado con ID:", viajeId);
      }
    }

    // 4. INSERTAMOS EL EVENTO
    const queryEvento = `
      INSERT INTO eventos (tipo, fecha, hora, categoria, disciplina, viaje_id, nombreCarrera) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [eventResult] = await connection.query(queryEvento, [
      tipo, 
      fecha, 
      hora, 
      JSON.stringify(categoria), 
      disciplina || null, 
      viajeId, 
      nombreCarrera || null
    ]);

    await connection.commit();
    console.log("Evento creado con éxito. ID:", eventResult.insertId);
    res.status(201).json({ mensaje: "Evento creado correctamente", id: eventResult.insertId });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error en crearEvento:", error.message);
    res.status(500).json({ mensaje: "Error interno al crear el evento" });
  } finally {
    if (connection) connection.release();
  }
};

/* =========================
   OBTENER TODOS LOS EVENTOS (CALENDARIO GENERAL)
========================= */
exports.obtenerEventos = async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id, e.tipo, e.fecha, e.hora, e.categoria, e.disciplina, e.nombreCarrera,
        e.viaje_id,
        v.plazas_totales, 
        v.hora_salida_furgoneta, 
        (SELECT COUNT(*) 
         FROM transporte_reservas tr 
         WHERE tr.viaje_id = e.viaje_id) AS plazas_ocupadas
      FROM eventos e
      LEFT JOIN transporte_viajes v ON e.viaje_id = v.id
      ORDER BY e.fecha, e.hora
    `;
    const [results] = await db.query(query); 

    const eventosParseados = results.map((evento) => {
      const nuevoEvento = { ...evento };

      // 1. Parseo de Categoría
      try {
        if (typeof nuevoEvento.categoria === 'string') {
          nuevoEvento.categoria = (!nuevoEvento.categoria || nuevoEvento.categoria === 'null') 
            ? [] : JSON.parse(nuevoEvento.categoria);
        }
      } catch (e) {
        nuevoEvento.categoria = nuevoEvento.categoria ? [nuevoEvento.categoria] : [];
      }

      // 2. Lógica de plazas DINÁMICA y BLINDAJE DE HORA (CamelCase y barra_baja unificados)
      if (nuevoEvento.viaje_id) {
        const maxPlazas = parseInt(nuevoEvento.plazas_totales) || 8; 
        const ocupadas = parseInt(nuevoEvento.plazas_ocupadas) || 0;
        const disponibles = Math.max(0, maxPlazas - ocupadas);

        // 🚀 DUPLICAMOS PARA BLINDAR AMBOS FRONTENDS
        nuevoEvento.plazasTotales = maxPlazas;
        nuevoEvento.plazas_totales = maxPlazas;
        nuevoEvento.plazasOcupadas = ocupadas;
        nuevoEvento.plazas_ocupadas = ocupadas;
        nuevoEvento.plazasDisponibles = disponibles;
        nuevoEvento.plazas_disponibles = disponibles;
        
        if (evento.hora_salida_furgoneta) {
          nuevoEvento.hora_salida_furgoneta = String(evento.hora_salida_furgoneta).slice(0, 5);
        } else {
          nuevoEvento.hora_salida_furgoneta = "07:30";
        }
      } else {
        nuevoEvento.plazasTotales = 0;
        nuevoEvento.plazas_totales = 0;
        nuevoEvento.plazasOcupadas = 0;
        nuevoEvento.plazas_ocupadas = 0;
        nuevoEvento.plazasDisponibles = 0;
        nuevoEvento.plazas_disponibles = 0;
        nuevoEvento.hora_salida_furgoneta = null;
      }

      return nuevoEvento;
    });

    return res.status(200).json(eventosParseados);
  } catch (error) {
    console.error('Error crítico en obtenerEventos:', error); 
    return res.status(500).json({ error: 'Error al procesar eventos' });
  }
};
/* =========================
   ELIMINAR EVENTO
========================= */
exports.eliminarEvento = async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [evento] = await connection.query('SELECT viaje_id FROM eventos WHERE id = ?', [id]);
    
    if (evento.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    const viajeId = evento[0].viaje_id;

    await connection.query('DELETE FROM eventos_deportistas WHERE id_evento = ?', [id]);
    await connection.query('DELETE FROM eventos WHERE id = ?', [id]);

    if (viajeId) {
      // Comprobamos si queda algún OTRO evento que siga usando este mismo viaje compartido
      const [otrosEventos] = await connection.query(
        'SELECT id FROM eventos WHERE viaje_id = ? LIMIT 1', 
        [viajeId]
      );

      // Si ningún otro entrenamiento lo usa, limpiamos las reservas de los pasajeros y el viaje por completo
      if (otrosEventos.length === 0) {
        console.log(`Borrando logística huérfana de la furgoneta con ID: ${viajeId}`);
        await connection.query('DELETE FROM transporte_reservas WHERE viaje_id = ?', [viajeId]);
        await connection.query('DELETE FROM transporte_viajes WHERE id = ?', [viajeId]);
      }
    }

    await connection.commit();
    res.status(200).json({ message: 'Evento y logística de furgoneta eliminados correctamente' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/* =========================
   MODIFICAR EVENTO
========================= */
exports.modificarEvento = async (req, res) => {
  const { id } = req.params;
  const { 
    tipo, 
    fecha, 
    hora, 
    categoria, 
    disciplina, 
    conTransporte, 
    plazasTransporte, 
    nombreCarrera,
    hora_salida_furgoneta 
  } = req.body;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    let viajeId = null;
    const habilitarTransporte = conTransporte === true || conTransporte === 'true';

    if (habilitarTransporte) {
      // 1. Buscamos si ya existe algún viaje para esa fecha
      const [viajeExistente] = await connection.query(
        'SELECT id FROM transporte_viajes WHERE fecha = ? LIMIT 1', 
        [fecha]
      );

      if (viajeExistente.length > 0) {
        viajeId = viajeExistente[0].id;
        console.log("Modificar: Reutilizando viaje existente con ID:", viajeId);
        
        await connection.query(
          'UPDATE transporte_viajes SET plazas_totales = ?, hora_salida_furgoneta = ? WHERE id = ?',
          [plazasTransporte, hora_salida_furgoneta, viajeId]
        );
      } else {
        // 2. Si cambiaron la fecha a una que no tiene viaje, creamos la logística con su hora
        console.log("Modificar: Creando un nuevo viaje compartido para la fecha:", fecha);
        const [nuevoViaje] = await connection.query(
          'INSERT INTO transporte_viajes (fecha, plazas_totales, hora_salida_furgoneta) VALUES (?, ?, ?)',
          [fecha, plazasTransporte, hora_salida_furgoneta]
        );
        viajeId = nuevoViaje.insertId;
      }
    }

    // 3. Convertimos la categoría a texto plano (JSON en string) para guardarlo de forma segura
    const categoriaString = Array.isArray(categoria) ? JSON.stringify(categoria) : JSON.stringify([categoria]);

    // 4. Ejecutamos la actualización del evento principal unificando el viajeId (o null si se desactivó)
    const queryUpdate = `
      UPDATE eventos 
      SET tipo = ?, fecha = ?, hora = ?, categoria = ?, disciplina = ?, viaje_id = ?, nombreCarrera = ?
      WHERE id = ?
    `;
    const valuesUpdate = [
      tipo, 
      fecha, 
      hora, 
      categoriaString, 
      (tipo === 'Pista' || tipo === 'Carrera') ? disciplina : null,
      viajeId, 
      tipo === 'Carrera' ? nombreCarrera : null,
      id
    ];

    const [result] = await connection.query(queryUpdate, valuesUpdate);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    await connection.commit();
    res.status(200).json({ message: 'Evento modificado correctamente' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error al modificar evento:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};
/* =========================
   FILTRAR POR CATEGORÍAS
========================= */
exports.getEventosFiltradosPorCategorias = async (req, res) => {
  try {
    const categoriasParam = req.query.categorias;
    if (!categoriasParam) {
      return res.status(400).json({ error: 'No se proporcionaron categorías' });
    }

    const categorias = JSON.parse(categoriasParam);
    const sql = `
      SELECT * FROM eventos
      WHERE JSON_OVERLAPS(categoria, ?)
      ORDER BY fecha, hora
    `;

    const [eventos] = await db.query(sql, [JSON.stringify(categorias)]);
    res.json(eventos);
  } catch (error) {
    console.error('Error en getEventosFiltradosPorCategorias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* =========================
   APUNTAR DEPORTISTA A EVENTO (Con Transacción y Transporte)
========================= */
exports.apuntarDeportistaAEvento = async (req, res) => {
  const eventoId = req.params.id; 
  const { hijoId, enFurgoneta } = req.body; 

  let connection;
  try {
    connection = await db.getConnection(); 
    await connection.beginTransaction();

    // 1. Obtener el viaje_id del evento
    const [evento] = await connection.query('SELECT viaje_id FROM eventos WHERE id = ?', [eventoId]); 
    if (evento.length === 0) throw new Error("Evento no encontrado");
    const viajeId = evento[0].viaje_id;

    // 2. Si quiere furgoneta, validamos y reservamos
    if (enFurgoneta && viajeId) {
      // Comprobar disponibilidad real con bloqueo de fila
      const [viaje] = await connection.query(
        'SELECT plazas_totales FROM transporte_viajes WHERE id = ? FOR UPDATE', [viajeId]
      );
      
      const [ocupados] = await connection.query(
        'SELECT COUNT(*) as total FROM transporte_reservas WHERE viaje_id = ?', [viajeId]
      ); 

      if (ocupados[0].total >= viaje[0].plazas_totales) {
        throw new Error("Lo sentimos, la furgoneta ya está llena.");
      }

      // Insertar en la tabla de logística
      await connection.query(
        'INSERT IGNORE INTO transporte_reservas (viaje_id, deportista_id) VALUES (?, ?)',
        [viajeId, hijoId]
      );
    }

    // 3. Registrar la asistencia al evento (independientemente del transporte)
    await connection.query(
      'INSERT INTO eventos_deportistas (id_evento, id_deportista, enFurgoneta) VALUES (?, ?, ?)',
      [eventoId, hijoId, enFurgoneta ? 1 : 0]
    ); 

    await connection.commit(); 
    res.status(200).json({ mensaje: 'Inscripción y transporte registrados' }); 

  } catch (error) {
    if (connection) await connection.rollback(); 
    res.status(400).json({ mensaje: error.message });
  } finally {
    if (connection) connection.release();
  }
};

/* =========================
   EVENTOS APUNTADOS (PADRE) - VERSION AGRUPADA
========================= */
exports.getEventosApuntados = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    // 1. Obtener ID del padre vinculado al usuario
    const [padre] = await db.query(
      'SELECT id FROM padres WHERE id_usuario = ?', [usuarioId]
    );
    if (padre.length === 0) return res.status(404).json([]);

    // 2. Obtener los IDs de todos los hijos de ese padre
    const [hijos] = await db.query(
      'SELECT id_deportista FROM padres_hijos WHERE id_padre = ?',
      [padre[0].id]
    );
    if (hijos.length === 0) return res.status(200).json([]); 

    const hijosIds = hijos.map((h) => h.id_deportista); 

    // 3. Query: Traemos los eventos y los datos de transporte de los hijos
    const [rows] = await db.query(
      `SELECT 
        e.*, 
        ed.enFurgoneta, 
        ed.id_deportista 
       FROM eventos e 
       INNER JOIN eventos_deportistas ed ON e.id = ed.id_evento
       WHERE ed.id_deportista IN (?)
       ORDER BY e.fecha, e.hora`,
      [hijosIds]
    );

    // 4. AGRUPACIÓN: Una sola tarjeta por evento con lista de hijos dentro
    const eventosMap = new Map();

    rows.forEach((row) => {
      if (!eventosMap.has(row.id)) {
        // Si el evento no está en el mapa, lo creamos
        const eventoUnico = { ...row };

        // Formatear categorías (JSON string -> Array/String)
        if (typeof eventoUnico.categoria === 'string') {
          try {
            const parsed = JSON.parse(eventoUnico.categoria);
            eventoUnico.categoria = Array.isArray(parsed) ? parsed.join(', ') : parsed;
          } catch { /* mantener original si falla el parse */ }
        }

        // Inicializamos la lista de hijos inscritos con el primero que encontramos
        eventoUnico.hijosInscritos = [{
          id: row.id_deportista,
          enFurgoneta: row.enFurgoneta === 1 || row.enFurgoneta === true
        }];

        // Guardamos en el mapa usando el ID del evento como clave única
        eventosMap.set(row.id, eventoUnico);
      } else {
        // Si el evento ya existe (ej: Nil ya está), añadimos al siguiente hijo (ej: Loreto)
        eventosMap.get(row.id).hijosInscritos.push({
          id: row.id_deportista,
          enFurgoneta: row.enFurgoneta === 1 || row.enFurgoneta === true
        });
      }
    });

    const resultadoFinal = Array.from(eventosMap.values()); 
    
    console.log(`✅ Home Padre: Enviando ${resultadoFinal.length} eventos (agrupados por hijos).`); 
    res.json(resultadoFinal); 

  } catch (error) {
    console.error('Error en getEventosApuntados:', error);
    res.status(500).json({ error: 'Error interno del servidor' }); 
  }
};
/* =========================
   DESAPUNTAR DEPORTISTA DE EVENTO
========================= */
exports.desapuntarDeportistaDeEvento = async (req, res) => {
  const eventoId = req.params.id;
  const hijoId = req.query.hijoId;
  const usuarioId = req.user.id;

  if (!hijoId) {
    return res.status(400).json({ mensaje: 'Falta el ID del hijo' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Verificar que el padre existe
    const [padre] = await connection.query(
      'SELECT id FROM padres WHERE id_usuario = ?',
      [usuarioId]
    );
    if (padre.length === 0) throw new Error("Padre no encontrado");
    
    const padreId = padre[0].id;

    // 2. Verificar que el hijo pertenece al padre
    const [esHijo] = await connection.query(
      'SELECT * FROM padres_hijos WHERE id_padre = ? AND id_deportista = ?',
      [padreId, hijoId]
    );
    if (esHijo.length === 0) throw new Error("No tienes permiso sobre este deportista");

    // 3. Obtener el viaje_id del evento actual
    const [eventoRow] = await connection.query('SELECT viaje_id FROM eventos WHERE id = ?', [eventoId]);
    const viajeId = eventoRow[0]?.viaje_id;

    // 4. Borrar la inscripción al evento
    await connection.query(
      'DELETE FROM eventos_deportistas WHERE id_evento = ? AND id_deportista = ?',
      [eventoId, hijoId]
    );

    // 5. LOGICA DE FURGONETA COMPARTIDA:
    // Si el evento tenía transporte, verificamos si el niño sigue apuntado a OTROS eventos
    // del MISMO viaje. Si ya no le quedan más eventos ese día, le quitamos la reserva de furgoneta.
    if (viajeId) {
      const [otrasInscripciones] = await connection.query(
        `SELECT ed.id_deportista 
         FROM eventos_deportistas ed
         JOIN eventos e ON ed.id_evento = e.id
         WHERE e.viaje_id = ? AND ed.id_deportista = ?`,
        [viajeId, hijoId]
      );

      if (otrasInscripciones.length === 0) {
        // Ya no tiene más entrenamientos que usen ese transporte -> Liberamos la plaza real
        console.log(`Liberando reserva de furgoneta en viaje ${viajeId} para el niño ${hijoId}`);
        await connection.query(
          'DELETE FROM transporte_reservas WHERE viaje_id = ? AND deportista_id = ?',
          [viajeId, hijoId]
        );
      }
    }

    await connection.commit();
    res.status(200).json({ mensaje: 'Inscripción cancelada y transporte sincronizado' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error en desapuntar:', error.message);
    res.status(400).json({ mensaje: error.message });
  } finally {
    if (connection) connection.release();
  }
};
/* =========================
   OBTENER HIJOS APUNTADOS A UN EVENTO (por ID de evento)
=========================*/
exports.getHijosApuntadosEvento = async (req, res) => {
  const eventoId = req.params.id;
  const usuarioId = req.user.id;

  try {
    // Buscar padre
    const [padre] = await db.query(
      'SELECT id FROM padres WHERE id_usuario = ?', [usuarioId]
    );
    if (padre.length === 0) return res.status(404).json([]);

    // Obtener hijos apuntados a ese evento
    // Dentro de getAsistenciasPadre...
    const [hijos] = await db.query(
      `SELECT d.id, d.nombre, TRIM(BOTH '"' FROM TRIM(d.categoria)) as categoria
       FROM eventos_deportistas ed
       INNER JOIN deportistas d ON d.id = ed.id_deportista
       INNER JOIN padres_hijos ph ON ph.id_deportista = d.id
       WHERE ed.id_evento = ? AND ph.id_padre = ?`,
      [eventoId, padre[0].id]
    );

    res.json(hijos);
  } catch (error) {
    console.error('Error en getHijosApuntadosEvento:', error);
    res.status(500).json({ mensaje: 'Error interno' });
  }
};

/* =========================
   COMPROBAR SI HIJO ESTÁ APUNTADO (por query param)
========================= */
exports.estaApuntado = async (req, res) => {
  const eventoId = req.params.id;
  const hijoId = req.query.hijoId;

  console.log(`➡️ estaApuntado eventoId=${eventoId}, hijoId=${hijoId}`);

  if (!hijoId) {
    return res.status(400).json({ apuntado: false, mensaje: 'Falta hijoId' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM eventos_deportistas WHERE id_evento = ? AND id_deportista = ?',
      [eventoId, hijoId]
    );
    console.log('🔎 Query result:', rows);
    res.json({ apuntado: rows.length > 0 });
  } catch (error) {
    console.error('Error en estaApuntado:', error);
    res.status(500).json({ apuntado: false, mensaje: 'Error interno' });
  }
};

// Obtener eventos de la categoría del entrenador logueado
exports.getEventosDeMiCategoria = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    console.log("=> [BACKEND] Buscando entrenamientos para el entrenador ID:", usuarioId);

    // 1. Recuperamos la categoría del entrenador
    const [rows] = await db.query(
      'SELECT categoria FROM entrenador WHERE id = ?',
      [usuarioId]
    );
    
    if (rows.length === 0 || !rows[0].categoria) {
      console.log("=> [BACKEND] El entrenador no existe o no tiene categorías asignadas.");
      return res.json([]);
    }

    let entrenadorCategorias = rows[0].categoria;
    let arrayCategorias = [];

    // 2. Normalizamos el formato para garantizar un array limpio de JavaScript
    if (typeof entrenadorCategorias === 'string') {
      try {
        const parseado = JSON.parse(entrenadorCategorias);
        arrayCategorias = Array.isArray(parseado) ? parseado : [parseado];
      } catch (e) {
        arrayCategorias = entrenadorCategorias.split(',').map(c => c.trim());
      }
    } else if (Array.isArray(entrenadorCategorias)) {
      arrayCategorias = entrenadorCategorias;
    }

    const jsonStringPerfecto = JSON.stringify(arrayCategorias);
    console.log("=> [BACKEND] Array del entrenador formateado para la Query:", jsonStringPerfecto);

    // 3. Consulta SQL con doble CAST de seguridad para mitigar errores de tipo
    const sql = `
      SELECT 
        e.*, 
        v.id AS viaje_id,
        v.plazas_totales,
        v.descripcion AS descripcion_viaje,
        (SELECT COUNT(*) FROM transporte_reservas tr WHERE tr.viaje_id = v.id) AS plazas_ocupadas
      FROM eventos e
      LEFT JOIN transporte_viajes v ON e.viaje_id = v.id
      WHERE JSON_OVERLAPS(CAST(e.categoria AS JSON), CAST(? AS JSON))
      ORDER BY e.fecha, e.hora
    `;

    const [eventos] = await db.query(sql, [jsonStringPerfecto]);
    console.log(`=> [BACKEND] ¡Éxito! Encontrados ${eventos.length} entrenamientos.`);

    // 4. Mapeo y parseo seguro para entregar al Frontend de la aplicación móvil
    const parseados = eventos.map(ev => {
      try {
        if (typeof ev.categoria === 'string') {
          const parsed = JSON.parse(ev.categoria);
          ev.categoria = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (err) {
        ev.categoria = [];
      }
      return ev;
    });

    return res.json(parseados);

  } catch (error) {
    console.error('❌ [BACKEND ERROR] Fallo crítico en getEventosDeMiCategoria:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor', detalle: error.message });
  }
};

/* =================================
   OBTENER ASISTENCIAS (VISTA ENTRENADOR)
================================= */
exports.getAsistenciasAdmin = async (req, res) => {
  try {
    const categoria = req.query.categoria || 'TODAS';

    // 1. Obtener todos los deportistas registrados bajo el filtro de categoría seleccionado
    let deportistasSql = `SELECT id, nombre, categoria FROM deportistas`;
    const deportistasParams = [];
    if (categoria && categoria !== 'TODAS') {
      deportistasSql += ` WHERE categoria = ?`;
      deportistasParams.push(categoria);
    }
    const [deportistasRows] = await db.query(deportistasSql, deportistasParams);

    if (deportistasRows.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Obtener TODOS los entrenamientos sin importar si la tabla intermedia está vacía
    const [eventosRows] = await db.query(
      `SELECT id AS eventoId, DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, tipo FROM eventos ORDER BY fecha ASC`
    );

    // 3. Obtener el mapa de reservas e inscripciones reales existentes
    const [asistenciasRows] = await db.query(
      `SELECT id_deportista AS deportistaId, id_evento AS eventoId FROM eventos_deportistas`
    );

    // Inyectamos las claves en un Set para búsquedas en tiempo constante O(1)
    const setAsistencias = new Set();
    asistenciasRows.forEach(row => {
      setAsistencias.add(`${row.deportistaId}-${row.eventoId}`);
    });

    // 4. Hidratar la respuesta cruzando dinámicamente cada alumno con todos los días oficiales
    const resultado = deportistasRows.map(dep => {
      const listaAsistencias = [];

      eventosRows.forEach(ev => {
        // Comprobamos si existe relación de asistencia en la base de datos
        const haAsistido = setAsistencias.has(`${dep.id}-${ev.eventoId}`);
        
        listaAsistencias.push({
          fecha: ev.fecha,
          tipo: ev.tipo,
          asistio: haAsistido // Bandera booleana limpia que React Native interpretará como ✅ o ❌
        });
      });

      return {
        deportistaId: String(dep.id),
        nombre: dep.nombre,
        categoria: dep.categoria,
        asistencias: listaAsistencias
      };
    });

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('❌ [BACKEND ERROR] Fallo crítico en getAsistenciasAdmin:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar la asistencia global.' });
  }
};

exports.verificarApuntado = async (req, res) => {
  const { id } = req.params;
  const { hijoId } = req.query;

  try {
    const [rows] = await db.query(
      'SELECT id_evento, id_deportista, enFurgoneta FROM eventos_deportistas WHERE id_evento = ? AND id_deportista = ?',
      [id, hijoId]
    );

    if (rows.length > 0) {
      // LOG DE CONTROL: Mira esto en la terminal cuando entres a la pantalla
      console.log(`Checking DB for ${hijoId}: enFurgoneta is ${rows[0].enFurgoneta}`);
      res.json({ apuntado: true, info: rows[0] });
    } else {
      res.json({ apuntado: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Actualizar transporte (Lógica de Padre)
exports.actualizarTransporteHijo = async (req, res) => {
  const eventoId = req.params.id; 
  const { hijoId, enFurgoneta } = req.body; 

  let connection;
  try {
    connection = await db.getConnection(); 
    await connection.beginTransaction(); 

    // 1. Obtener el viaje_id del evento
    const [eventoRows] = await connection.query('SELECT viaje_id FROM eventos WHERE id = ?', [eventoId]); 
    
    if (eventoRows.length === 0) throw new Error("Evento no encontrado.");
    
    const viajeId = eventoRows[0].viaje_id; // Extraemos el ID correctamente

    if (!viajeId && enFurgoneta) {
      throw new Error("Este evento no dispone de logística de transporte."); 
    }

    if (enFurgoneta) {
      // Validar plazas en el viaje
      const [viaje] = await connection.query('SELECT plazas_totales FROM transporte_viajes WHERE id = ?', [viajeId]); 
      const [ocupados] = await connection.query('SELECT COUNT(*) as total FROM transporte_reservas WHERE viaje_id = ?', [viajeId]); 

      if (ocupados[0].total >= viaje[0].plazas_totales) {
        throw new Error("Lo sentimos, la furgoneta está llena."); 
      }

      // Añadir reserva (IGNORE evita error si ya existía)
      await connection.query('INSERT IGNORE INTO transporte_reservas (viaje_id, deportista_id) VALUES (?, ?)', [viajeId, hijoId]);
    } else {
      // Eliminar de la reserva del viaje
      await connection.query('DELETE FROM transporte_reservas WHERE viaje_id = ? AND deportista_id = ?', [viajeId, hijoId]);
    }

    // 2. Sincronizar enFurgoneta en todos los eventos que compartan este viaje_id para este niño
    // (Esto es clave para que si cambias el transporte en el físico, se cambie también en la pista)
    await connection.query(
      `UPDATE eventos_deportistas ed
       JOIN eventos e ON ed.id_evento = e.id
       SET ed.enFurgoneta = ?
       WHERE e.viaje_id = ? AND ed.id_deportista = ?`,
      [enFurgoneta ? 1 : 0, viajeId, hijoId]
    ); 

    await connection.commit(); 
    res.status(200).json({ mensaje: 'Transporte actualizado correctamente' });
  } catch (error) {
    if (connection) await connection.rollback(); 
    console.error("Error en actualizarTransporteHijo:", error.message);
    res.status(400).json({ mensaje: error.message });
  } finally {
    if (connection) connection.release(); 
  }
};
// ENDPOINT 1: Solo para la lista de asistencia del entrenamiento actual
exports.getInscritosEvento = async (req, res) => {
  try {
    const eventoId = req.params.id;
    // Esta consulta solo trae a los que se apuntaron específicamente a este evento_id
    const sql = `
      SELECT d.id, d.nombre, d.categoria, ed.enFurgoneta 
      FROM eventos_deportistas ed
      INNER JOIN deportistas d ON d.id = ed.id_deportista
      WHERE ed.id_evento = ?`;
    const [rows] = await db.query(sql, [eventoId]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener inscritos' });
  }
};

// ENDPOINT 2: Solo para la furgoneta (Global por viaje_id)
exports.getPasajerosViaje = async (req, res) => {
  try {
    const { viajeId } = req.params;

    // Usamos DISTINCT para que, aunque el SQL intente multiplicar filas,
    // solo nos devuelva una fila por cada deportista real.
    const sql = `
      SELECT DISTINCT 
        d.id, 
        d.nombre, 
        d.categoria 
      FROM transporte_reservas tr
      JOIN deportistas d ON tr.deportista_id = d.id
      WHERE tr.viaje_id = ?
    `;
    
    const [pasajeros] = await db.query(sql, [viajeId]);
    
    // Este log te confirmará en la terminal que ahora salen 6
    console.log(`✅ Ocupación confirmada para viaje ${viajeId}: ${pasajeros.length} personas`);
    
    res.json(pasajeros);
  } catch (error) {
    console.error("Error en getPasajerosViaje:", error);
    res.status(500).json({ error: 'Error al obtener pasajeros' });
  }
};

/* =================================
   OBTENER ASISTENCIAS (VISTA PADRE - UNIFICADA)
   Esta función sirve para Técnico y Físico filtrando por mes/año
================================= */
exports.getAsistenciasPadre = async (req, res) => {
  const { mes, anio } = req.query;
  const usuarioId = req.user.id;

  try {
    const [padre] = await db.query('SELECT id FROM padres WHERE id_usuario = ?', [usuarioId]);
    if (padre.length === 0) return res.json([]);

    const [hijos] = await db.query(
      `SELECT id, nombre, categoria FROM deportistas 
       WHERE id IN (SELECT id_deportista FROM padres_hijos WHERE id_padre = ?)`,
      [padre[0].id]
    );

    const resultadosFinales = [];

    for (const hijo of hijos) {
      // 1. ASISTENCIAS (Puntos del calendario)
      // Esta consulta no ha cambiado, es la que hace que aparezcan los puntos
      const [asistencias] = await db.query(
        `SELECT e.fecha, e.tipo
         FROM eventos e
         JOIN eventos_deportistas ed ON e.id = ed.id_evento
         WHERE ed.id_deportista = ? AND MONTH(e.fecha) = ? AND YEAR(e.fecha) = ?`,
        [hijo.id, mes, anio]
      );

      // 2. TOTALES (La parte que fallaba para U16 y Valeria)
      // Limpiamos la categoría del hijo de posibles comillas extras para la búsqueda
      const categoriaLimpia = String(hijo.categoria).replace(/[\[\]" ]/g, '');

      const [totales] = await db.query(
        `SELECT 
            COUNT(DISTINCT CASE WHEN tipo IN ('Pista', 'Carrera') THEN id END) as totalTecnico,
            COUNT(DISTINCT CASE WHEN tipo = 'Físico' THEN id END) as totalFisico
         FROM eventos
         WHERE (
            -- Buscamos la categoría dentro del JSON o como texto plano
            categoria LIKE CONCAT('%', ?, '%')
         )
         AND MONTH(fecha) = ? AND YEAR(fecha) = ?`,
        [categoriaLimpia, mes, anio]
      );

      resultadosFinales.push({
        hijoId: hijo.id,
        nombre: hijo.nombre,
        asistencias: asistencias,
        totalTecnico: totales[0].totalTecnico || 0,
        totalFisico: totales[0].totalFisico || 0,
        totalEntrenamientosMes: (totales[0].totalTecnico || 0) + (totales[0].totalFisico || 0)
      });
    }

    res.json(resultadosFinales);

  } catch (error) {
    console.error('Error en getAsistenciasPadre:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.obtenerDetalleEventoPadre = async (req, res) => {
  const eventoId = req.params.id;

  try {
    // Forzamos un flag limpio (tiene_transporte) directamente desde la base de datos
    const query = `
      SELECT 
        e.id AS id, 
        e.tipo AS tipo, 
        DATE_FORMAT(e.fecha, '%Y-%m-%d') AS fecha, 
        e.hora AS hora, 
        e.categoria AS categoria, 
        e.disciplina AS disciplina, 
        e.nombreCarrera AS nombreCarrera, 
        e.viaje_id AS viaje_id,
        IF(e.viaje_id IS NOT NULL, 1, 0) AS tiene_transporte,
        v.plazas_totales AS plazas_totales, 
        v.hora_salida_furgoneta AS hora_salida_furgoneta, 
        (SELECT COUNT(*) FROM transporte_reservas tr WHERE tr.viaje_id = e.viaje_id) AS plazas_ocupadas
      FROM eventos e
      LEFT JOIN transporte_viajes v ON e.viaje_id = v.id
      WHERE e.id = ?
    `;

    const [results] = await db.query(query, [eventoId]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Entrenamiento no encontrado' });
    }

    const evento = results[0];

    // Evaluamos usando el flag directo de la base de datos para evitar errores de tipado en Node
    if (evento.tiene_transporte === 1 || evento.viaje_id > 0) {
      const maxPlazas = evento.plazas_totales !== null ? parseInt(evento.plazas_totales) : 8;
      const ocupadas = parseInt(evento.plazas_ocupadas) || 0;

      evento.plazasTotales = maxPlazas;
      evento.plazas_totales = maxPlazas;
      evento.plazasDisponibles = Math.max(0, maxPlazas - ocupadas);
      evento.plazas_disponibles = Math.max(0, maxPlazas - ocupadas);

      if (evento.hora_salida_furgoneta) {
        evento.hora_salida_furgoneta = String(evento.hora_salida_furgoneta).slice(0, 5);
      } else {
        evento.hora_salida_furgoneta = "07:30";
      }
    } else {
      evento.plazasTotales = 0;
      evento.plazas_totales = 0;
      evento.plazasDisponibles = 0;
      evento.plazas_disponibles = 0;
      evento.hora_salida_furgoneta = null;
    }

    // Parseo de categorías
    try {
      if (typeof evento.categoria === 'string') {
        evento.categoria = JSON.parse(evento.categoria);
      }
    } catch (e) {
      evento.categoria = evento.categoria ? [evento.categoria] : [];
    }

    // Console log de control para ver exactamente qué sale hacia el móvil
    console.log(`=> [API DETALLE PADRE] Enviando Evento ${evento.id}. Transporte: ${evento.tiene_transporte}, Hora: ${evento.hora_salida_furgoneta}`);

    return res.status(200).json(evento);

  } catch (error) {
    console.error("Error crítico en obtenerDetalleEventoPadre:", error);
    return res.status(500).json({ error: "Error interno del servidor al procesar el detalle del padre" });
  }
};
/* =================================
   OBTENER ASISTENCIAS (VISTA ENTRENADOR - UNIFICADA)
================================= */
exports.getAsistenciasEntrenador = async (req, res) => {
  const entrenadorUsuarioId = req.user.id; 

  try {
    // 1. Obtener las categorías del entrenador logueado
    const [entrenadores] = await db.query(
      'SELECT categoria FROM entrenador WHERE id = ?',
      [entrenadorUsuarioId]
    );

    if (entrenadores.length === 0) {
      return res.status(404).json({ mensaje: 'Entrenador no encontrado' });
    }
    
    let entrenadorCategorias = entrenadores[0].categoria;
    let arrayCategorias = [];

    if (typeof entrenadorCategorias === 'string') {
      try {
        const parseado = JSON.parse(entrenadorCategorias);
        arrayCategorias = Array.isArray(parseado) ? parseado : [parseado];
      } catch (e) {
        arrayCategorias = entrenadorCategorias.split(',').map(c => c.trim());
      }
    } else if (Array.isArray(entrenadorCategorias)) {
      arrayCategorias = entrenadorCategorias;
    }

    if (arrayCategorias.length === 0) {
      return res.json({ deportistas: [], eventosGlobales: [] });
    }

    // 2. CONSTRUIR REGEXP ESTRICTA:
    // Si tus categorías son ['U14', 'U16', 'FIS'], creará un patrón como: '[[:<:]](U14|U16|FIS)[[:>:]]' o para versiones modernas: '\\b(U14|U16|FIS)\\b'
    // Para asegurar compatibilidad con cualquier versión de MySQL, usamos un patrón de límites flexible:
    const patronRegexp = arrayCategorias.map(c => `(^|[^a-zA-Z0-9])${c}([^a-zA-Z0-9]|$)`).join('|');

    // 3. Traer todos los eventos filtrando con REGEXP estricto y DATE_FORMAT
    const [todosLosEventos] = await db.query(
      `SELECT id, DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, tipo FROM eventos 
       WHERE categoria REGEXP ?
       ORDER BY fecha ASC`,
      [patronRegexp]
    );

    // 4. Traer las asistencias de los deportistas usando el mismo REGEXP estricto
    const sql = `
      SELECT 
        d.id AS deportistaId,
        d.nombre,
        e.id AS eventoId,
        DATE_FORMAT(e.fecha, '%Y-%m-%d') AS fecha,
        e.tipo
      FROM deportistas d
      LEFT JOIN eventos_deportistas ed ON d.id = ed.id_deportista
      LEFT JOIN eventos e ON ed.id_evento = e.id
      WHERE d.categoria REGEXP ?
      ORDER BY d.id, e.fecha;
    `;
    
    const [asistencias] = await db.query(sql, [patronRegexp]);

    // 5. Agrupar los resultados para el Frontend
    const deportistasMap = new Map();
    asistencias.forEach(row => {
      const { deportistaId, nombre, fecha, tipo } = row;
      
      if (!deportistasMap.has(deportistaId)) {
        deportistasMap.set(deportistaId, {
          deportistaId: String(deportistaId),
          nombre,
          asistencias: [] 
        });
      }
      
      if (fecha && tipo) {
        deportistasMap.get(deportistaId).asistencias.push({ fecha, tipo });
      }
    });

    return res.json({
      deportistas: Array.from(deportistasMap.values()),
      eventosGlobales: todosLosEventos
    });

  } catch (error) {
    console.error('Error en getAsistenciasEntrenador:', error);
    return res.status(500).json({ error: 'Error al obtener las asistencias' });
  }
};