const db = require('../db'); // conexión a MySQL

const getMisHijos = async (req, res) => {
  try {
    const padreId = req.usuario.id;

    const [rows] = await db.execute(
      'SELECT * FROM deportistas WHERE padre_id = ?',
      [padreId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error en getMisHijos:', err);
    res.status(500).json({ error: 'Error al obtener los hijos' });
  }
};

const getDeportistaPorId = async (req, res) => {
  try {
    const deportistaId = req.params.id;

    const [rows] = await db.execute(
      'SELECT * FROM deportistas WHERE id = ?',
      [deportistaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Deportista no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error en getDeportistaPorId:', err);
    res.status(500).json({ error: 'Error al obtener el deportista' });
  }
};

module.exports = {
  getMisHijos,
  getDeportistaPorId,
};
