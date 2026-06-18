const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const deportistaController = require('../controllers/deportistaController');

router.get('/mis_hijos', verifyToken, deportistaController.getMisHijos); 
router.post('/anadir_hijo', verifyToken, deportistaController.anadirHijo);
router.get('/expedientes-completos', deportistaController.getDeportistasConTutores);

router.put('/actualizar/:id', deportistaController.actualizarDeportista);
router.delete('/eliminar/:id', deportistaController.eliminarDeportista);

module.exports = router;

console.log('deportistaController cargado correctamente');
