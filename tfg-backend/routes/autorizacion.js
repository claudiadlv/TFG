const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const autorizacionController = require('../controllers/autorizacionController'); 

const JWT_SECRET = process.env.JWT_SECRET || 'secreto-super-clave';

router.post('/login', autorizacionController.login); 
router.post('/solicitar-registro', autorizacionController.solicitarRegistro);

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ mensaje: 'Refresh token requerido' });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET || 'refresh-secret', (err, decoded) => {
    if (err) return res.status(403).json({ mensaje: 'Refresh token inválido' });

    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET || 'access-secret',
      { expiresIn: '2h' }
    );
    res.json({ accessToken });
  });
});

module.exports = router;
