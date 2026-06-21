const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');

const { obtenerFotos, guardarFoto, eliminarFoto } = require('../controllers/fotosController');

router.get('/', verifyToken, obtenerFotos);
router.post('/', verifyToken, guardarFoto);
router.delete('/', verifyToken, eliminarFoto);    
router.delete('/:id', verifyToken, eliminarFoto); 

module.exports = router;