// middleware/verifyToken.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET || 'access-secret', (err, decoded) => {
    if (err) return res.status(403).json({ mensaje: 'Token inválido' });

    req.user = decoded;
    next();
  });
};
