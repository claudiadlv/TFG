const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  console.log('🛡 Entrando a middleware verifyToken');

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log('🚫 No se encontró el encabezado Authorization');
    return res.status(401).json({ mensaje: 'Token no proporcionado' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    console.log('🚫 Formato de token inválido:', authHeader);
    return res.status(400).json({ mensaje: 'Formato de token inválido' });
  }

  const token = tokenParts[1];
  console.log('🔑 Token extraído:', token);

  jwt.verify(token, process.env.JWT_SECRET || 'access-secret', (err, decoded) => {
    if (err) {
      console.log('❌ Token inválido:', err.message);
      return res.status(403).json({ mensaje: 'Token inválido' });
    }

    console.log('✅ Token válido. Payload decodificado:', decoded);
    req.user = decoded;
    next();
  });
};

exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ mensaje: 'Refresh token requerido' });
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ mensaje: 'Refresh token inválido' });
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, rol: decoded.rol },
      process.env.JWT_SECRET || 'access-secret',
      { expiresIn: '2h' }
    );

    res.json({ accessToken: newAccessToken });
  });
};
