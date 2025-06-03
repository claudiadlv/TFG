const db = require('../db');

exports.crearEvento = async (req, res) => {
  const { fecha, hora, tipo, categoria, disciplina, nombreCarrera } = req.body;

  try {
    // Campos obligatorios
    const campos = ['fecha', 'hora', 'tipo', 'categoria'];
    const valores = [fecha, hora, tipo, categoria];

    // Si el tipo es Pista o Carrera, se añade disciplina
    if (tipo === 'Pista' || tipo === 'Carrera' && disciplina) {
      campos.push('disciplina');
      valores.push(disciplina);
    }

    // Si el tipo es Carrera, se añade nombreCarrera
    if (tipo === 'Carrera') {
      campos.push('nombreCarrera');
      valores.push(nombreCarrera);
    }

    const placeholders = campos.map(() => '?').join(', ');
    const sql = `INSERT INTO eventos (${campos.join(', ')}) VALUES (${placeholders})`;

    await db.query(sql, valores);
    res.status(201).json({ mensaje: 'Evento creado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el evento' });
  }
};

exports.obtenerEventos = (_req, res) => {
  db.query('SELECT * FROM eventos ORDER BY fecha, hora', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener eventos' });
    } else {
      res.json(results);
    }
  });
};

exports.eliminarEvento = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM eventos WHERE id = ?', [id]);
    res.status(200).json({ mensaje: 'Evento eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};

exports.modificarEvento = async (req, res) => {
  const { id } = req.params;
  const { fecha, hora, tipo, categoria, disciplina, nombreCarrera } = req.body;

  try {
    const campos = ['fecha', 'hora', 'tipo', 'categoria'];
    const valores = [fecha, hora, tipo, categoria];

    if (tipo === 'Pista' || tipo === 'Carrera') {
      campos.push('disciplina');
      valores.push(disciplina);
    }

    if (tipo === 'Carrera') {
      campos.push('nombreCarrera');
      valores.push(nombreCarrera);
    }

    const updates = campos.map((campo) => `${campo} = ?`).join(', ');
    const sql = `UPDATE eventos SET ${updates} WHERE id = ?`;
    valores.push(id);

    await db.query(sql, valores);
    res.status(200).json({ mensaje: 'Evento actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
};