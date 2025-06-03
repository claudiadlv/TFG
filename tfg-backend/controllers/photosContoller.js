const pool = require('../db'); // Ajusta esto según cómo conectas a la BD

const guardarFoto = async (req, res) => {
  const { ruta, fecha } = req.body;
  console.log('BODY RECIBIDO:', ruta, fecha);

  try {
    await pool.query(
      'INSERT INTO fotos (ruta, fecha_creacion) VALUES ($1, $2)',
      [ruta, fecha]
    );
    res.status(200).json({ message: 'Foto guardada correctamente' });
  } catch (error) {
    console.error('💥 Error real en el INSERT:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const eliminarFoto = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM fotos WHERE id = $1', [id]);
    res.status(200).json({ message: 'Foto eliminada' });
  } catch (error) {
    console.error('Error al eliminar foto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { guardarFoto, eliminarFoto };