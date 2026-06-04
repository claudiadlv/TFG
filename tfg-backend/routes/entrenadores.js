const express = require('express');
const router = express.Router();
const entrenadoresController = require('../controllers/entrenadoresController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', entrenadoresController.createEntrenador);
router.get('/', entrenadoresController.getEntrenadores);
router.get('/mi_perfil', verifyToken, entrenadoresController.getMiPerfil);

router.get('/:id', entrenadoresController.getEntrenadorById);
router.put('/:id', entrenadoresController.updateEntrenador);
router.delete('/:id', entrenadoresController.deleteEntrenador);

module.exports = router;
