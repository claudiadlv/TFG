const jwt = require('jsonwebtoken');
const db = require('../db');

exports.login = (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }

  db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], (err, results) => {
    if (err) {
      console.error('Error en login:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = results[0];

    if (usuario.contrasena !== contrasena) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    const accessToken = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET || 'access-secret',
      { expiresIn: '2h' }
    );

    const refreshToken = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.REFRESH_SECRET || 'refresh-secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      mensaje: 'Login exitoso',
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      }
    });
  });
};
