const { promisePool: db } = require('../db');

// 1. Obtener los viajes (ADMIN)
exports.getViajesAdmin = async (req, res) => {
  try {
    const sql = `
      SELECT 
        tv.id, 
        tv.descripcion AS destino, 
        DATE_FORMAT(tv.fecha, '%Y-%m-%d %H:%i:%s') AS fecha_salida, 
        tv.plazas_totales,
        tv.hora_salida_furgoneta,
        IFNULL(GROUP_CONCAT(DISTINCT d.categoria SEPARATOR ', '), 'Global') AS categoria,
        (tv.plazas_totales - (
          SELECT COUNT(*) 
          FROM transporte_reservas tr_sub 
          WHERE tr_sub.viaje_id = tv.id
        )) AS plazas_disponibles,
        'abierto' AS estado
      FROM transporte_viajes tv
      LEFT JOIN transporte_reservas tr ON tv.id = tr.viaje_id
      LEFT JOIN deportistas d ON tr.deportista_id = d.id
      WHERE tv.activo = 1
      GROUP BY tv.id, tv.descripcion, tv.fecha, tv.plazas_totales, tv.hora_salida_furgoneta
      ORDER BY fecha_salida ASC
    `;
    const [viajes] = await db.query(sql);
    return res.status(200).json(viajes);
  } catch (error) {
    console.error('Error en getViajesAdmin:', error);
    return res.status(500).json({ error: 'Error interno al procesar los viajes globales' });
  }
};

exports.getPasajerosViajeAdmin = async (req, res) => {
  const { id: viajeId } = req.params;
  try {
    const sql = `
      SELECT 
        d.nombre, 
        d.categoria
      FROM transporte_reservas tr
      INNER JOIN deportistas d ON tr.deportista_id = d.id
      WHERE tr.viaje_id = ?
      ORDER BY d.nombre ASC
    `;
    const [pasajeros] = await db.query(sql, [viajeId]);
    return res.status(200).json(pasajeros);
  } catch (error) {
    console.error('[BACKEND ERROR] Fallo en getPasajerosViajeAdmin:', error);
    return res.status(500).json({ error: 'Error al obtener los pasajeros globales del viaje' });
  }
};

// 2. Reservar una plaza (Corregida la tabla 'transportes' -> 'transporte_reservas')
exports.reservarPlaza = async (req, res) => {
    const { id_evento, id_deportista } = req.body;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // CORRECCIÓN AQUÍ: Se usa transporte_reservas
        const [transporte] = await connection.query(
            `SELECT id, plazas_disponibles, estado FROM transporte_reservas WHERE id_evento = ? FOR UPDATE`,
            [id_evento]
        );

        if (transporte.length === 0) throw new Error('No hay transporte configurado.');
        if (transporte[0].estado !== 'abierto') throw new Error('La reserva está cerrada.');
        if (transporte[0].plazas_disponibles <= 0) throw new Error('La furgoneta está llena.');

        const [inscripcion] = await connection.query(
            `SELECT enFurgoneta FROM eventos_deportistas WHERE id_evento = ? AND id_deportista = ?`,
            [id_evento, id_deportista]
        );

        if (inscripcion.length === 0) throw new Error('El deportista no está convocado.');
        if (inscripcion[0].enFurgoneta === 1) throw new Error('Ya tiene plaza reservada.');

        // Actualizar contador
        await connection.query(
            `UPDATE transporte_reservas SET plazas_disponibles = plazas_disponibles - 1 WHERE id_evento = ?`,
            [id_evento]
        );

        // Marcar en la tabla intermedia
        await connection.query(
            `UPDATE eventos_deportistas SET enFurgoneta = 1 WHERE id_evento = ? AND id_deportista = ?`,
            [id_evento, id_deportista]
        );

        await connection.commit();
        res.status(200).json({ mensaje: 'Plaza reservada con éxito' });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(400).json({ mensaje: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// 3. Cancelar una plaza
exports.cancelarPlaza = async (req, res) => {
    const { id_evento, id_deportista } = req.body;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [inscripcion] = await connection.query(
            `SELECT enFurgoneta FROM eventos_deportistas WHERE id_evento = ? AND id_deportista = ?`,
            [id_evento, id_deportista]
        );

        if (inscripcion.length === 0 || inscripcion[0].enFurgoneta === 0) {
            throw new Error('El deportista no tiene plaza reservada.');
        }

        await connection.query(
            `UPDATE transporte_reservas SET plazas_disponibles = plazas_disponibles + 1 WHERE id_evento = ?`,
            [id_evento]
        );

        await connection.query(
            `UPDATE eventos_deportistas SET enFurgoneta = 0 WHERE id_evento = ? AND id_deportista = ?`,
            [id_evento, id_deportista]
        );

        await connection.commit();
        res.status(200).json({ mensaje: 'Reserva cancelada con éxito' });

    } catch (error) {
        if (connection) await connection.rollback();
        res.status(400).json({ mensaje: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// 5. Crear transporte
exports.crearTransporte = async (req, res) => {
    const { id_evento, plazas_totales } = req.body;
    try {
        const query = `
            INSERT INTO transporte_reservas (id_evento, plazas_totales, plazas_disponibles, estado)
            VALUES (?, ?, ?, 'abierto')
        `;
        await db.query(query, [id_evento, plazas_totales, plazas_totales]);
        res.status(201).json({ mensaje: 'Transporte habilitado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear transporte' });
    }
};

exports.getViajesTransporteEntrenador = async (req, res) => {
  const entrenadorUsuarioId = req.user.id; 

  try {
    console.log(`=> [TRANSPORTE ENTRENADOR] Iniciando cruce de tablas para ID: ${entrenadorUsuarioId}`);

    // 1. Obtener las categorías que gestiona este entrenador
    const [entrenador] = await db.query(
      'SELECT categoria FROM entrenador WHERE id = ?',
      [entrenadorUsuarioId]
    );

    if (entrenador.length === 0 || !entrenador[0].categoria) {
      return res.json([]); 
    }

    let entrenadorCategorias = entrenador[0].categoria;
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
      return res.json([]);
    }

    // Creamos el patrón REGEXP estricto para las categorías (ej: U14, U16...)
    const patronRegexp = arrayCategorias.map(c => `(^|[^a-zA-Z0-9])${c}([^a-zA-Z0-9]|$)`).join('|');

    // 🚀 CONSULTA CORREGIDA CON LEFT JOIN PARA VER LOGÍSTICA VACÍA
    const sql = `
      SELECT 
        tv.id, 
        tv.descripcion AS destino, 
        DATE_FORMAT(tv.fecha, '%Y-%m-%d %H:%i:%s') AS fecha_salida, 
        tv.plazas_totales,
        tv.hora_salida_furgoneta,
        -- Agrupamos las categorías de los deportistas que van apuntados o la del viaje si está vacío
        IFNULL(GROUP_CONCAT(DISTINCT d.categoria SEPARATOR ', '), '') AS categoria,
        (tv.plazas_totales - (
          SELECT COUNT(*) 
          FROM transporte_reservas tr_sub 
          WHERE tr_sub.viaje_id = tv.id
        )) AS plazas_disponibles,
        'abierto' AS estado
      FROM transporte_viajes tv
      LEFT JOIN transporte_reservas tr ON tv.id = tr.viaje_id
      LEFT JOIN deportistas d ON tr.deportista_id = d.id
      WHERE tv.activo = 1 
        AND (d.categoria REGEXP ? OR tr.id IS NULL) -- Que sea de su categoría O que la furgoneta esté vacía
      GROUP BY tv.id, tv.descripcion, tv.fecha, tv.plazas_totales, tv.hora_salida_furgoneta
      ORDER BY fecha_salida ASC
    `;

    const [viajes] = await db.query(sql, [patronRegexp]);
    console.log(`=> [TRANSPORTE] Encontrados ${viajes.length} viajes (incluyendo vacíos) vinculados al entrenador.`);
    
    return res.json(viajes);

  } catch (error) {
    console.error('[BACKEND ERROR] Fallo en getViajesTransporteEntrenador:', error);
    return res.status(500).json({ error: 'Error interno al procesar los viajes de transporte' });
  }
};

exports.getPasajerosViajeEntrenador = async (req, res) => {
  const { id: viajeId } = req.params;
  const entrenadorUsuarioId = req.user.id;

  try {
    // 1. Obtener las categorías del entrenador para filtrar la lista de pasajeros
    const [entrenador] = await db.query(
      'SELECT categoria FROM entrenador WHERE id = ?',
      [entrenadorUsuarioId]
    );

    if (entrenador.length === 0 || !entrenador[0].categoria) {
      return res.json([]);
    }

    let entrenadorCategorias = entrenador[0].categoria;
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

    const patronRegexp = arrayCategorias.map(c => `(^|[^a-zA-Z0-9])${c}([^a-zA-Z0-9]|$)`).join('|');

    // 2. QUERY: Traemos los deportistas apuntados a este viaje_id que cumplan con la categoría
    const sql = `
      SELECT 
        d.nombre, 
        d.categoria
      FROM transporte_reservas tr
      INNER JOIN deportistas d ON tr.deportista_id = d.id
      WHERE tr.viaje_id = ? AND d.categoria REGEXP ?
      ORDER BY d.nombre ASC
    `;

    const [pasajeros] = await db.query(sql, [viajeId, patronRegexp]);
    return res.json(pasajeros);

  } catch (error) {
    console.error('❌ [BACKEND ERROR] Fallo en getPasajerosViajeEntrenador:', error);
    return res.status(500).json({ error: 'Error al obtener los pasajeros del viaje' });
  }
};

exports.getViajesTransportePadre = async (req, res) => {
  const usuarioLogueadoId = req.user.id; // ID del usuario desde el token JWT

  try {
    console.log(`=> [TRANSPORTE PADRE CORREGIDO] Buscando datos para Usuario ID: ${usuarioLogueadoId}`);

    // 1. Obtener el ID del padre real en la tabla 'padres' usando su 'id_usuario'
    const [perfilPadre] = await db.query(
      'SELECT id FROM padres WHERE id_usuario = ?',
      [usuarioLogueadoId]
    );

    if (perfilPadre.length === 0) {
      return res.status(200).json({ viajes: [], reservas: [] });
    }

    const padreIdReal = perfilPadre[0].id;

    // 2. Obtener los hijos cruzando la tabla intermedia 'padres_hijos' con 'deportistas'
    const sqlHijos = `
      SELECT d.id, d.nombre, d.categoria 
      FROM padres_hijos ph
      INNER JOIN deportistas d ON ph.id_deportista = d.id
      WHERE ph.id_padre = ?
    `;
    const [hijos] = await db.query(sqlHijos, [padreIdReal]);

    if (hijos.length === 0) {
      return res.status(200).json({ viajes: [], reservas: [] });
    }

    const idsHijos = hijos.map(h => h.id);

    // 3. QUERY ESTRICTA DE VIAJES: Trae solo los viajes con reserva activa de los hijos
    const sqlViajes = `
      SELECT 
        tv.id, 
        tv.descripcion AS destino, 
        DATE_FORMAT(tv.fecha, '%Y-%m-%d %H:%i:%s') AS fecha_salida, 
        tv.plazas_totales,
        tv.hora_salida_furgoneta,
        (tv.plazas_totales - (
          SELECT COUNT(*) FROM transporte_reservas tr_sub WHERE tr_sub.viaje_id = tv.id
        )) AS plazas_disponibles
      FROM transporte_viajes tv
      INNER JOIN transporte_reservas tr ON tv.id = tr.viaje_id
      WHERE tr.deportista_id IN (?) AND tv.activo = 1
      GROUP BY tv.id, tv.descripcion, tv.fecha, tv.plazas_totales, tv.hora_salida_furgoneta
      ORDER BY tv.fecha ASC
    `;

    const [viajes] = await db.query(sqlViajes, [idsHijos]);

    // 4. QUERY DE RESERVAS MODIFICADA: Ahora sí hace INNER JOIN con 'deportistas' 
    // para traer la propiedad 'nombre_deportista' que el frontend necesita pintar.
    const sqlReservas = `
      SELECT 
        tr.viaje_id, 
        tr.deportista_id, 
        d.nombre AS nombre_deportista 
      FROM transporte_reservas tr
      INNER JOIN deportistas d ON tr.deportista_id = d.id
      WHERE tr.deportista_id IN (?)
    `;
    const [reservas] = await db.query(sqlReservas, [idsHijos]);

    // 5. Devolvemos la estructura exacta esperada
    return res.status(200).json({
      viajes,
      reservas
    });

  } catch (error) {
    console.error('Error al obtener los viajes filtrados del padre:', error);
    return res.status(500).json({ error: 'Error interno del servidor al cargar el transporte' });
  }
};

exports.getViajesAdmin = async (req, res) => {
  try {
    const sql = `
      SELECT 
        tv.id, 
        tv.descripcion AS destino, 
        DATE_FORMAT(tv.fecha, '%Y-%m-%d %H:%i:%s') AS fecha_salida, 
        tv.plazas_totales,
        tv.hora_salida_furgoneta,
        IFNULL(GROUP_CONCAT(DISTINCT d.categoria SEPARATOR ', '), 'Global') AS categoria,
        (tv.plazas_totales - (
          SELECT COUNT(*) 
          FROM transporte_reservas tr_sub 
          WHERE tr_sub.viaje_id = tv.id
        )) AS plazas_disponibles,
        'abierto' AS estado
      FROM transporte_viajes tv
      LEFT JOIN transporte_reservas tr ON tv.id = tr.viaje_id
      LEFT JOIN deportistas d ON tr.deportista_id = d.id
      WHERE tv.activo = 1
      GROUP BY tv.id, tv.descripcion, tv.fecha, tv.plazas_totales, tv.hora_salida_furgoneta
      ORDER BY fecha_salida ASC
    `;
    const [viajes] = await db.query(sql);
    return res.status(200).json(viajes);
  } catch (error) {
    console.error('❌ [BACKEND ERROR] Fallo en getViajesAdmin:', error);
    return res.status(500).json({ error: 'Error interno al procesar los viajes globales' });
  }
};
