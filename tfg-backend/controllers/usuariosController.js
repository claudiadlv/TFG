//Variables como usuario y contraseña de MySQL
const db = require('../db'); // Importa la conexión a la base de datos
const jwt = require('jsonwebtoken');

//Función para obtener todos los usuarios
exports.getUsuarios = (req, res) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            res.status(500).send('Error fetching users');
            return;
        }
        res.json(results);
    });
};
//Función para obtener un usuario por su ID
//Mirar esto porque creo q no me sirve porque no voy a tener el id
// en la base de datos en todo caso seria x el correo
exports.getUsuarioById = (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            res.status(500).send('Error fetching user');
            return;
        }
        if (results.length === 0) {
            res.status(404).send('User not found');
            return;
        }
        res.json(results[0]);
    });
};      
//Función para crear un nuevo usuario
exports.createUsuario = (req, res) => {
    const { nombre, correo, contrasena } = req.body;
    db.query('INSERT INTO usuarios (nombre, correo, contrasena) VALUES (?, ?, ?)', [nombre, correo, contrasena], (err, results) => {
        if (err) {
            console.error('Error creating user:', err);
            res.status(500).send('Error creating user');
            return;
        }
        res.status(201).json({ id: results.insertId, nombre, correo });
    });
};        

exports.getUsuarioActual = (req, res) => {
  const userId = req.user.id;

  db.query('SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?', [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al obtener usuario' });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json(results[0]);
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

  db.query(
    'INSERT INTO solicitudes_registro (nombre_tutor, apellidos_tutor, correo_tutor, nombre_hijo, apellidos_hijo, fecha_nacimiento, contrasena) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      nombre_tutor,
      apellidos_tutor,
      correo_tutor,
      nombre_hijo,
      apellidos_hijo,
      fecha_nacimiento,
      contrasena,
    ],
    (err, results) => {
      if (err) {
        console.error('Error creando solicitud:', err);
        res.status(500).send('Error al registrar la solicitud');
        return;
      }
      res.status(201).json({ mensaje: 'Solicitud registrada correctamente' });
    }
  );
};
