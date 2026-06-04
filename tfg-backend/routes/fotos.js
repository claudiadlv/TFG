const express = require('express');
const router = express.Router();

// 1. IMPORTAMOS EL MIDDLEWARE USANDO SU NOMBRE REAL: verifyToken
const { verifyToken } = require('../middleware/authMiddleware');

// 2. IMPORTAMOS LOS CONTROLADORES (Que ya sabemos que funcionan de lujo)
const { obtenerFotos, guardarFoto, eliminarFoto } = require('../controllers/fotosController');

// 3. DEFINICIÓN DE ENDPOINTS ASIGNANDO CORRECTAMENTE EL MIDDLEWARE
router.get('/', verifyToken, obtenerFotos);
router.post('/', verifyToken, guardarFoto);
router.delete('/', verifyToken, eliminarFoto);    
router.delete('/:id', verifyToken, eliminarFoto); 

module.exports = router;