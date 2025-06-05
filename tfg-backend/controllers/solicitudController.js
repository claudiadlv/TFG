const db = require('../db');

exports.getSolicitud = (req, res) => {
  db.query(
    'SELECT * FROM solicitudes_registro WHERE estado = "pendiente"',
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener solicitudes' });
      res.json(results);
    }
  );
};

exports.crearSolicitud = (req, res) => {
  const {
    nombre_tutor,
    apellidos_tutor,
    correo_tutor,
    nombre_hijo,
    apellidos_hijo,
    fecha_nacimiento,
    contrasena
  } = req.body;

  if (!nombre_tutor || !apellidos_tutor || !correo_tutor || !nombre_hijo || !apellidos_hijo || !fecha_nacimiento || !contrasena) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  db.query(
    'INSERT INTO solicitudes_registro (nombre_tutor, apellidos_tutor, correo_tutor, nombre_hijo, apellidos_hijo, fecha_nacimiento, contrasena) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [nombre_tutor, apellidos_tutor, correo_tutor, nombre_hijo, apellidos_hijo, fecha_nacimiento, contrasena],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al guardar la solicitud' });
      }

      res.status(201).json({ mensaje: 'Solicitud enviada correctamente' });
    }
  );
};

exports.aceptarSolicitud = (req, res) => {
  const id = req.params.id;
  console.log(`[ACEPTAR] Iniciando aceptación de solicitud con ID ${id}`);

  db.query('SELECT * FROM solicitudes_registro WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      console.error('[ACEPTAR] Solicitud no encontrada:', err);
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const solicitud = results[0];

    // 1. Crear usuario (rol = padre)
    const crearUsuario = () => {
      db.query(
        'INSERT INTO usuarios (nombre, apellidos, correo, fecha_nacimiento, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)',
        [
          solicitud.nombre_tutor,
          solicitud.apellidos_tutor,
          solicitud.correo_tutor,
          '1970-01-01', // Placeholder de fecha
          solicitud.contrasena,
          'padre'
        ],
        (err, result) => {
          if (err) {
            console.error('[ACEPTAR] Error al crear usuario:', err.sqlMessage);
            return res.status(500).json({ error: 'Error al crear el usuario' });
          }

          const idUsuario = result.insertId;

          // 2. Crear padre
          db.query(
            'INSERT INTO padres (id_usuario, nombre, apellidos, correo) VALUES (?, ?, ?, ?)',
            [idUsuario, solicitud.nombre_tutor, solicitud.apellidos_tutor, solicitud.correo_tutor],
            (err2) => {
              if (err2) {
                console.error('[ACEPTAR] Error al crear padre:', err2.sqlMessage);
                return res.status(500).json({ error: 'Error al crear el padre' });
              }

              crearHijo(idUsuario);
            }
          );
        }
      );
    };

    // 3. Crear hijo y relación con padre
    const crearHijo = (idUsuario) => {
      db.query('SELECT id FROM padres WHERE id_usuario = ?', [idUsuario], (err, results) => {
        if (err || results.length === 0) {
          console.error('[ACEPTAR] Padre no encontrado tras crear usuario');
          return res.status(500).json({ error: 'Error al obtener el padre' });
        }

        const idPadre = results[0].id;

        db.query(
          'INSERT INTO deportistas (nombre, apellidos, fecha_nacimiento) VALUES (?, ?, ?)',
          [solicitud.nombre_hijo, solicitud.apellidos_hijo, solicitud.fecha_nacimiento],
          (err2, result2) => {
            if (err2) {
              console.error('[ACEPTAR] Error al crear hijo:', err2.sqlMessage);
              return res.status(500).json({ error: 'Error al crear al hijo' });
            }

            const idHijo = result2.insertId;

            db.query(
              'INSERT INTO padres_hijos (id_padre, id_deportista) VALUES (?, ?)',
              [idPadre, idHijo],
              (err3) => {
                if (err3) {
                  console.error('[ACEPTAR] Error al crear relación padre-hijo:', err3.sqlMessage);
                  return res.status(500).json({ error: 'Error al vincular padre e hijo' });
                }

                aprobarSolicitud();
              }
            );
          }
        );
      });
    };

    // 4. Marcar solicitud como aprobada
    const aprobarSolicitud = () => {
      db.query(
        'UPDATE solicitudes_registro SET estado = "aprobada" WHERE id = ?',
        [id],
        (err) => {
          if (err) {
            console.error('[ACEPTAR] Error al actualizar solicitud:', err.sqlMessage);
            return res.status(500).json({ error: 'Error al actualizar solicitud' });
          }

          console.log('[ACEPTAR] Solicitud aprobada correctamente');
          res.json({ mensaje: 'Solicitud aceptada correctamente' });
        }
      );
    };

    crearUsuario();
  });
};

exports.eliminarSolicitud = (req, res) => {
  const id = req.params.id;

  db.query(
    'UPDATE solicitudes_registro SET estado = "rechazada" WHERE id = ?',
    [id],
    (err) => {
      if (err) return res.status(500).json({ error: 'Error al rechazar la solicitud' });
      res.json({ mensaje: 'Solicitud rechazada correctamente' });
    }
  );
};