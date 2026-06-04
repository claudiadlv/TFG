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

module.exports = {
  getMisHijos,
  getDeportistaPorId,
  anadirHijo,
};