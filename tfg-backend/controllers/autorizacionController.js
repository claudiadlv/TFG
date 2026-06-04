const jwt = require('jsonwebtoken');
const { pool: db } = require('../db');

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
      { expiresIn: '7d' }
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

exports.solicitarRegistro = (req, res) => {
  const {
    nombre_tutor,
    apellidos_tutor,
    correo_tutor,
    nombre_hijo,
    apellidos_hijo,
    fecha_nacimiento,
    contrasena,
  } = req.body;

  if (!nombre_tutor || !apellidos_tutor || !correo_tutor || !nombre_hijo || !apellidos_hijo || !fecha_nacimiento || !contrasena) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  db.query(
    `INSERT INTO solicitudes_registro 
    (nombre_tutor, apellidos_tutor, correo_tutor, nombre_hijo, apellidos_hijo, fecha_nacimiento, contrasena) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nombre_tutor, apellidos_tutor, correo_tutor, nombre_hijo, apellidos_hijo, fecha_nacimiento, contrasena],
    (err, result) => {
      if (err) {
        console.error('Error al guardar solicitud:', err);
        return res.status(500).json({ error: 'Error al guardar la solicitud' });
      }

      res.status(200).json({ mensaje: 'Solicitud guardada correctamente' });
    }
  );
};