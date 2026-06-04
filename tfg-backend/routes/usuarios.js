const express = require('express');
const router = express.Router();
const usuarios = require('../controllers/usuariosController');
const { verifyToken } = require('../middleware/authMiddleware'); // <-- importar el middleware

router.get('/', usuarios.getUsuarios);
router.get('/yo', verifyToken, usuarios.getUsuarioActual); // <-- PROTEGIDA con token
router.get('/:id', usuarios.getUsuarioById);
router.post('/', usuarios.createUsuario);

module.exports = router;
