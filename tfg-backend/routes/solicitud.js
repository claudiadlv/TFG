const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');

router.get('/', solicitudController.getSolicitud);
router.post('/', solicitudController.crearSolicitud);
router.post('/:id/aceptar', solicitudController.aceptarSolicitud);
router.post('/:id/rechazar', solicitudController.eliminarSolicitud);

module.exports = router;
