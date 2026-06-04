const express = require('express');
const router = express.Router();
const transporteController = require('../controllers/transporteController');
const { verifyToken } = require('../middleware/authMiddleware'); 

router.post('/reservar', verifyToken, transporteController.reservarPlaza);
router.get('/entrenador', verifyToken, transporteController.getViajesTransporteEntrenador);
router.get('/:id/pasajeros', verifyToken, transporteController.getPasajerosViajeEntrenador);
router.get('/padre', verifyToken, transporteController.getViajesTransportePadre);

router.get('/admin', verifyToken, transporteController.getViajesAdmin);
router.get('/admin/:id/pasajeros', verifyToken, transporteController.getPasajerosViajeAdmin);

module.exports = router;