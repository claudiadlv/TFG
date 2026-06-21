const { pool: db } = require('../db');

// Crear entrenador
exports.createEntrenador = (req, res) => {
  const { nombre, apellidos, apellido, correo, fechaNacimiento, contrasena, categoria } = req.body;
  const rol = 'entrenador';
  
  // Usamos el que venga con prioridad para 'apellidos' (el plural enviado en el JSON)
  const apellidosFinal = apellidos || apellido;

  const sqlUsuario = `
    INSERT INTO usuarios (nombre, apellidos, correo, fecha_nacimiento, contrasena, rol)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sqlUsuario, [nombre, apellidosFinal, correo, fechaNacimiento, contrasena, rol], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al crear usuario entrenador' });
    }

    const userId = result.insertId;

    const categoriaJSON = Array.isArray(categoria) 
      ? JSON.stringify(categoria) 
      : JSON.stringify([categoria]);

    const sqlEntrenador = `
      INSERT INTO entrenador (id, categoria)
      VALUES (?, ?)
    `;
    
    db.query(sqlEntrenador, [userId, categoriaJSON], (err2, result2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: 'Error al asignar categoría al entrenador' });
      }
      
      res.status(201).json({
        id: userId,
        nombre,
        apellidos: apellidosFinal,
        correo,
        fechaNacimiento,
        rol,
        categoria: JSON.parse(categoriaJSON) // Devolvemos el array limpio al frontend
      });
    });
  });
};

// Obtener todos los entrenadores
exports.getEntrenadores = (req, res) => {
  const sql = `
    SELECT u.id, u.nombre, u.apellidos, u.correo, u.fecha_nacimiento, e.categoria
    FROM usuarios u
    JOIN entrenador e ON u.id = e.id
    WHERE u.rol = 'entrenador'
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al obtener entrenadores' });
    }
    res.json(rows);
  });
};

// Obtener entrenador por ID
exports.getEntrenadorById = (req, res) => {
  const sql = `
    SELECT u.id, u.nombre, u.apellidos, u.correo, u.fecha_nacimiento, e.categoria
    FROM usuarios u
    JOIN entrenador e ON u.id = e.id
    WHERE u.id = ? AND u.rol = 'entrenador'
  `;
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al obtener entrenador' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entrenador no encontrado' });
    }
    res.json(rows[0]);
  });
};

// Actualizar entrenador
exports.updateEntrenador = (req, res) => {
  const { nombre, apellidos, correo, fecha_nacimiento, categoria } = req.body;

  const sqlUsuario = `
    UPDATE usuarios
    SET nombre = ?, apellidos = ?, correo = ?, fecha_nacimiento = ?
    WHERE id = ? AND rol = 'entrenador'
  `;

  db.query(sqlUsuario, [nombre, apellidos, correo, fecha_nacimiento, req.params.id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al actualizar datos del entrenador' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entrenador no encontrado' });
    }

    let arrayFinal = [];

    if (Array.isArray(categoria)) {
      categoria.forEach(elemento => {
        if (typeof elemento === 'string' && (elemento.startsWith('[') || elemento.startsWith('{'))) {
          try {
            const parseado = JSON.parse(elemento);
            if (Array.isArray(parseado)) arrayFinal.push(...parseado);
            else arrayFinal.push(parseado);
          } catch (e) {
            arrayFinal.push(elemento);
          }
        } else {
          arrayFinal.push(elemento);
        }
      });
    } else if (typeof categoria === 'string') {
      if (categoria.startsWith('[')) {
        try {
          arrayFinal = JSON.parse(categoria);
        } catch (e) {
          arrayFinal = categoria.split(',').map(c => c.trim());
        }
      } else {
        arrayFinal = categoria.split(',').map(c => c.trim());
      }
    }

    // Filtramos para asegurar que solo persistan strings limpios y eliminamos duplicados
    const arrayLimpio = [...new Set(arrayFinal.filter(c => typeof c === 'string' && c.trim().length > 0))];
    
    // Convertimos a JSON plano estricto: '["U14","FIS"]'
    const categoriaJSON = JSON.stringify(arrayLimpio);

    const sqlEntrenador = `
      UPDATE entrenador
      SET categoria = ?
      WHERE id = ?
    `;
    
    db.query(sqlEntrenador, [categoriaJSON, req.params.id], (err2, result2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: 'Error al actualizar categoría del entrenador' });
      }
      res.json({ message: 'Entrenador actualizado correctamente' });
    });
  });
};

// Eliminar entrenador
exports.deleteEntrenador = (req, res) => {
  const id = req.params.id;

  const sqlDeleteEntrenador = `DELETE FROM entrenador WHERE id = ?`;
  db.query(sqlDeleteEntrenador, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al eliminar en tabla entrenador' });
    }

    const sqlDeleteUsuario = `DELETE FROM usuarios WHERE id = ? AND rol = 'entrenador'`;
    db.query(sqlDeleteUsuario, [id], (err2, result2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: 'Error al eliminar entrenador en tabla usuarios' });
      }
      if (result2.affectedRows === 0) {
        return res.status(404).json({ message: 'Entrenador no encontrado' });
      }
      res.json({ message: 'Entrenador eliminado correctamente' });
    });
  });
};

exports.getMiPerfil = (req, res) => {
  const userId = req.user.id; 

  const sql = `
    SELECT u.id, u.nombre, u.apellidos, u.correo, u.fecha_nacimiento, e.categoria
    FROM usuarios u
    JOIN entrenador e ON u.id = e.id
    WHERE u.id = ? AND u.rol = 'entrenador'
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al obtener datos del perfil del entrenador' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entrenador no encontrado' });
    }
    
    console.log('Resultado de la consulta:', rows); 

    res.json({
      id: rows[0].id,
      nombre: rows[0].nombre,
      apellidos: rows[0].apellidos,
      correo: rows[0].correo,
      fecha_nacimiento: rows[0].fecha_nacimiento,
      categorias_entrenadas: [rows[0].categoria]
    });
  });
};
