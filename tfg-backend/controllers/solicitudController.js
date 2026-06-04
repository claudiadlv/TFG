const { pool: db } = require('../db');

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
    fecha_nacimiento_tutor, 
    nombre_hijo,
    apellidos_hijo,
    fecha_nacimiento_hijo, 
    contrasena,
    categoria              
  } = req.body;

  const query = `
    INSERT INTO solicitudes_registro 
    (nombre_tutor, apellidos_tutor, correo_tutor, fecha_nacimiento_tutor, nombre_hijo, apellidos_hijo, fecha_nacimiento_hijo, contrasena, categoria) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    query,
    [nombre_tutor, apellidos_tutor, correo_tutor, fecha_nacimiento_tutor, nombre_hijo, apellidos_hijo, fecha_nacimiento_hijo, contrasena, categoria],
    (err, result) => {
      if (err) {
        console.error('Error en el INSERT:', err.sqlMessage);
        return res.status(500).json({ error: err.sqlMessage });
      }
      res.status(201).json({ mensaje: 'Solicitud enviada correctamente' });
    }
  );
};

exports.aceptarSolicitud = (req, res) => {
  const id = req.params.id;
  console.log(`[ACEPTAR] Procesando solicitud ID: ${id}`);

  db.query('SELECT * FROM solicitudes_registro WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const sol = results[0];

    // 1. Aseguramos que el usuario existe (u obtenemos el existente)
    const queryUser = `INSERT INTO usuarios (nombre, apellidos, correo, fecha_nacimiento, contrasena, rol) 
                       VALUES (?, ?, ?, ?, ?, 'padre')
                       ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`;
    
    db.query(queryUser, [sol.nombre_tutor, sol.apellidos_tutor, sol.correo_tutor, sol.fecha_nacimiento_tutor, sol.contrasena], (errU, resU) => {
      if (errU) return res.status(500).json({ error: 'Error en tabla usuarios' });

      // Recuperamos el ID (sea el nuevo o el que ya existía)
      const idUsuario = resU.insertId;

      // 2. Sincronizamos la tabla 'padres'
      // Si el correo ya existe, actualizamos su id_usuario para que coincida con la tabla usuarios
      const queryPadre = `INSERT INTO padres (id_usuario, nombre, apellidos, correo) 
                          VALUES (?, ?, ?, ?)
                          ON DUPLICATE KEY UPDATE id_usuario = VALUES(id_usuario), id=LAST_INSERT_ID(id)`;
      
      db.query(queryPadre, [idUsuario, sol.nombre_tutor, sol.apellidos_tutor, sol.correo_tutor], (errP, resP) => {
        if (errP) return res.status(500).json({ error: 'Error en tabla padres' });

        const idPadre = resP.insertId;

        // 3. Crear hijo (Deportista)
        db.query(
          'INSERT INTO deportistas (nombre, apellidos, fecha_nacimiento, categoria) VALUES (?, ?, ?, ?)',
          [sol.nombre_hijo, sol.apellidos_hijo, sol.fecha_nacimiento_hijo, sol.categoria],
          (errD, resD) => {
            if (errD) return res.status(500).json({ error: 'Error al crear hijo' });

            const idHijo = resD.insertId;

            // 4. Relación final padres_hijos
            db.query('INSERT INTO padres_hijos (id_padre, id_deportista) VALUES (?, ?)', [idPadre, idHijo], (errRel) => {
              if (errRel) return res.status(500).json({ error: 'Error al vincular familia' });

              // 5. Marcar como aprobada
              db.query('UPDATE solicitudes_registro SET estado = "aprobada" WHERE id = ?', [id], () => {
                console.log(`[ACEPTAR] ¡ÉXITO! Solicitud ${id} procesada.`);
                res.json({ mensaje: 'Aceptado con éxito' });
              });
            });
          }
        );
      });
    });
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