const { pool: db } = require('../db');

const getMisHijos = (req, res) => {
  const usuarioId = req.user.id;

  const sql = `
    SELECT d.*
    FROM deportistas d
    JOIN padres_hijos ph ON d.id = ph.id_deportista
    JOIN padres p ON p.id = ph.id_padre
    WHERE p.id_usuario = ?
  `;

  db.query(sql, [usuarioId], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ error: 'Error al obtener los hijos' });
    }

    res.json(results);
  });
};

const getDeportistaPorId = (req, res) => {
  const deportistaId = req.params.id;

  db.query('SELECT * FROM deportistas WHERE id = ?', [deportistaId], (err, results) => {
    if (err) {
      console.error('Error en getDeportistaPorId:', err);
      return res.status(500).json({ error: 'Error al obtener el deportista' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Deportista no encontrado' });
    }

    res.json(results[0]);
  });
};

const anadirHijo = (req, res) => {
  const padreUsuarioId = req.user.id;
  const { nombre, apellidos, fecha_nacimiento } = req.body;

  if (!nombre || !apellidos || !fecha_nacimiento) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  //Calcular categoría automáticamente
  const calcularCategoria = (fechaNacimientoStr) => {
    const nacimiento = new Date(fechaNacimientoStr);
    const hoy = new Date();
    const temporadaActual = hoy.getMonth() >= 6 ? hoy.getFullYear() : hoy.getFullYear() - 1;
    const fechaReferencia = new Date(`${temporadaActual}-12-31`);

    let edad = fechaReferencia.getFullYear() - nacimiento.getFullYear();
    const cumpleDespues =
      fechaReferencia.getMonth() < nacimiento.getMonth() ||
      (fechaReferencia.getMonth() === nacimiento.getMonth() && fechaReferencia.getDate() < nacimiento.getDate());

    if (cumpleDespues) edad--;

    if (edad <= 6) return 'U6';
    if (edad <= 7) return 'U8';
    if (edad <= 9) return 'U10';
    if (edad <= 11) return 'U12';
    if (edad <= 13) return 'U14';
    if (edad <= 15) return 'U16';
    return 'FIS';
  };

  const categoria = calcularCategoria(fecha_nacimiento);

  const buscarPadre = 'SELECT id FROM padres WHERE id_usuario = ?';
  db.query(buscarPadre, [padreUsuarioId], (err, result) => {
    if (err) {
      console.error('❌ Error al buscar padre:', err);
      return res.status(500).json({ mensaje: 'Error interno' });
    }

    if (result.length === 0) {
      return res.status(404).json({ mensaje: 'Padre no encontrado' });
    }

    const padreId = result[0].id;

    const insertarHijo = `
      INSERT INTO deportistas (nombre, apellidos, fecha_nacimiento, categoria)
      VALUES (?, ?, ?, ?)
    `;
    db.query(insertarHijo, [nombre, apellidos, fecha_nacimiento, categoria], (err, result) => {
      if (err) {
        console.error('❌ Error al insertar hijo:', err);
        return res.status(500).json({ mensaje: 'Error al insertar hijo' });
      }

      const nuevoDeportistaId = result.insertId;

      const asociarHijo = 'INSERT INTO padres_hijos (id_padre, id_deportista) VALUES (?, ?)';
      db.query(asociarHijo, [padreId, nuevoDeportistaId], (err) => {
        if (err) {
          console.error('❌ Error al asociar hijo con padre:', err);
          return res.status(500).json({ mensaje: 'Error al asociar hijo con padre' });
        }

        res.status(201).json({ mensaje: 'Hijo registrado correctamente', categoriaAsignada: categoria });
      });
    });
  });
};

const getDeportistasConTutores = (req, res) => {
  const query = `
    SELECT 
      d.id AS deportista_id, 
      d.nombre AS nombre_deportista, 
      d.apellidos AS apellidos_deportista, 
      d.fecha_nacimiento, 
      d.categoria,
      u.id AS tutor_id,
      u.nombre AS nombre_tutor, 
      u.apellidos AS apellidos_tutor,
      u.correo AS correo_tutor
    FROM deportistas d
    JOIN padres_hijos ph ON d.id = ph.id_deportista
    JOIN padres p ON p.id = ph.id_padre
    JOIN usuarios u ON p.id_usuario = u.id
    ORDER BY FIELD(d.categoria, 'FIS', 'U16', 'U14', 'U12', 'U10', 'U8', 'U6'), d.apellidos ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener deportistas con tutores:', err);
      return res.status(500).json({ mensaje: 'Error del servidor al consultar expedientes' });
    }
    return res.status(200).json(results);
  });
};

const actualizarDeportista = (req, res) => {
  const { id } = req.params;
  const { nombre, apellidos, fecha_nacimiento } = req.body;

  if (!nombre || !apellidos || !fecha_nacimiento) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
  }

  const calcularCategoria = (fechaNacimientoStr) => {
    const nacimiento = new Date(fechaNacimientoStr);
    const hoy = new Date();
    
    // Determinamos la temporada en base al año actual (el esquí va de invierno a invierno)
    const temporadaActual = hoy.getMonth() >= 6 ? hoy.getFullYear() : hoy.getFullYear() - 1;
    const fechaReferencia = new Date(`${temporadaActual}-12-31`);

    let edad = fechaReferencia.getFullYear() - nacimiento.getFullYear();
    const cumpleDespues =
      fechaReferencia.getMonth() < nacimiento.getMonth() ||
      (fechaReferencia.getMonth() === nacimiento.getMonth() && fechaReferencia.getDate() < nacimiento.getDate());

    if (cumpleDespues) edad--;

    // Rangos oficiales de la federación para las categorías de esquí alpino
    if (edad <= 6) return 'U6';
    if (edad <= 7) return 'U8';
    if (edad <= 9) return 'U10';
    if (edad <= 11) return 'U12';
    if (edad <= 13) return 'U14';
    if (edad <= 15) return 'U16';
    return 'FIS';
  };

  const nuevaCategoria = calcularCategoria(fecha_nacimiento);

  const query = `
    UPDATE deportistas 
    SET nombre = ?, apellidos = ?, fecha_nacimiento = ?, categoria = ? 
    WHERE id = ?
  `;

  db.query(query, [nombre, apellidos, fecha_nacimiento, nuevaCategoria, id], (err, result) => {
    if (err) {
      console.error('❌ Error al actualizar deportista y categoría:', err);
      return res.status(500).json({ mensaje: 'Error del servidor al actualizar el expediente' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Deportista no encontrado' });
    }

    // Devolvemos un estado 200 avisando de la categoría que se le ha asignado
    return res.status(200).json({ 
      mensaje: 'Expediente y categoría actualizados correctamente',
      categoriaAsignada: nuevaCategoria 
    });
  });
};

const eliminarDeportista = (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM deportistas WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('❌ Error al eliminar deportista de la base de datos:', err);
      return res.status(500).json({ mensaje: 'Error del servidor al procesar la baja' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'El expediente del deportista no existe o ya fue eliminado' });
    }

    return res.status(200).json({ mensaje: 'Expediente deportivo eliminado con éxito' });
  });
};

module.exports = {
  getMisHijos,
  getDeportistaPorId,
  anadirHijo,
  getDeportistasConTutores,
  actualizarDeportista,
  eliminarDeportista,
};