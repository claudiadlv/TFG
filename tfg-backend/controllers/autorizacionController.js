const jwt = require('jsonwebtoken');
const { pool: db } = require('../db');
const nodemailer = require('nodemailer');

const { hashearContrasena, compararContrasena } = require('../utils/crypto');

exports.login = (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }

  db.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
    if (err) {
      console.error('Error en login:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    if (results.length === 0) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }

    const usuario = results[0];

    const coinciden = await compararContrasena(contrasena, usuario.contrasena);

    if (!coinciden) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
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

exports.solicitarRegistro = async (req, res) => {
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

  try {
    // 🔒 Hasheamos la contraseña que introduce el padre antes de guardarla en la tabla de pre-registro
    const contrasenaHasheada = await hashearContrasena(contrasena);

    db.query(
      `INSERT INTO solicitudes_registro 
      (nombre_tutor, apellidos_tutor, correo_tutor, nombre_hijo, apellidos_hijo, fecha_nacimiento, contrasena) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre_tutor, apellidos_tutor, correo_tutor, nombre_hijo, apellidos_hijo, fecha_nacimiento, contrasenaHasheada],
      (err, result) => {
        if (err) {
          console.error('Error al guardar solicitud:', err);
          return res.status(500).json({ error: 'Error al guardar la solicitud' });
        }
        res.status(200).json({ mensaje: 'Solicitud guardada correctamente' });
      }
    );
  } catch (error) {
    console.error('Error de cifrado en registro:', error);
    res.status(500).json({ error: 'Error interno de seguridad' });
  }
};

exports.forgotPassword = (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ mensaje: 'Falta el correo electrónico' });
  }

  db.query('SELECT id, correo FROM usuarios WHERE correo = ?', [correo], (err, results) => {
    if (err) {
      console.error('Error al buscar usuario en forgotPassword:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    if (results.length === 0) {
      return res.status(200).json({ mensaje: 'Si el correo está registrado, recibirás un código de verificación pronto.' });
    }

    const usuario = results[0];
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    db.query(
      'UPDATE usuarios SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [token, expires, usuario.id],
      (errUpdate) => {
        if (errUpdate) {
          console.error('Error al guardar token en DB:', errUpdate);
          return res.status(500).json({ mensaje: 'Error del servidor al procesar la solicitud' });
        }

        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false, 
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: `"Club de Esquí" <${process.env.EMAIL_USER}>`,
          to: usuario.correo,
          subject: 'Código de recuperación de contraseña',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #1e3a8a;">Club de Esquí - Restablecer Contraseña</h2>
              <p>Introduce el siguiente código de verificación en tu aplicación móvil:</p>
              <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a; border-radius: 8px; margin: 20px 0;">
                ${token}
              </div>
            </div>
          `,
        };

        transporter.sendMail(mailOptions, (errMail) => {
          if (errMail) {
            console.error('Error al enviar el email:', errMail);
            return res.status(500).json({ mensaje: 'Error al enviar el correo de recuperación' });
          }
          return res.status(200).json({ mensaje: 'Código de verificación enviado al correo.' });
        });
      }
    );
  });
};

exports.resetPassword = (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
  }

  db.query(
    'SELECT id FROM usuarios WHERE reset_password_token = ? AND reset_password_expires > ?',
    [token, new Date()],
    async (err, results) => {
      if (err) {
        console.error('Error al verificar token en resetPassword:', err);
        return res.status(500).json({ mensaje: 'Error del servidor' });
      }

      if (results.length === 0) {
        return res.status(400).json({ mensaje: 'El código es incorrecto o ha expirado' });
      }

      const usuario = results[0];

      try {
        // 🔒 Hasheamos la nueva contraseña generada desde la recuperación externa
        const nuevaContrasenaHasheada = await hashearContrasena(newPassword);

        db.query(
          'UPDATE usuarios SET contrasena = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
          [nuevaContrasenaHasheada, usuario.id],
          (errUpdate) => {
            if (errUpdate) {
              console.error('Error al actualizar contraseña en DB:', errUpdate);
              return res.status(500).json({ mensaje: 'Error del servidor al actualizar la contraseña' });
            }
            return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
          }
        );
      } catch (error) {
        return res.status(500).json({ mensaje: 'Error interno al procesar cifrado' });
      }
    }
  );
};

exports.changePassword = (req, res) => {
  const { usuarioId, contrasenaActual, nuevaContrasena } = req.body;

  if (!usuarioId || !contrasenaActual || !nuevaContrasena) {
    return res.status(400).json({ mensaje: 'Faltan datos requeridos' });
  }

  db.query('SELECT contrasena FROM usuarios WHERE id = ?', [usuarioId], async (err, results) => {
    if (err) {
      console.error('Error al buscar usuario en changePassword:', err);
      return res.status(500).json({ mensaje: 'Error del servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const usuario = results[0];

    // 🔒 Comparamos de forma segura la contraseña actual usando bcrypt
    const coinciden = await compararContrasena(contrasenaActual, usuario.contrasena);

    if (!coinciden) {
      return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta' });
    }

    try {
      // 🔒 Hasheamos la nueva contraseña antes de persistirla en MySQL
      const nuevaContrasenaHasheada = await hashearContrasena(nuevaContrasena);

      db.query(
        'UPDATE usuarios SET contrasena = ? WHERE id = ?',
        [nuevaContrasenaHasheada, usuarioId],
        (errUpdate) => {
          if (errUpdate) {
            console.error('Error al actualizar contraseña en changePassword:', errUpdate);
            return res.status(500).json({ mensaje: 'Error del servidor al actualizar la contraseña' });
          }
          return res.status(200).json({ mensaje: 'Contraseña cambiada con éxito.' });
        }
      );
    } catch (error) {
      return res.status(500).json({ mensaje: 'Error interno de cifrado' });
    }
  });
};