const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const deportistaController = require('../controllers/deportistaController');

router.get('/mis_hijos', verifyToken, deportistaController.getMisHijos); 
router.post('/anadir_hijo', verifyToken, deportistaController.anadirHijo);

module.exports = router;

console.log('deportistaController cargado correctamente');
