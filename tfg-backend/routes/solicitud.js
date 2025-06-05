const express = require('express');
const router = express.Router();
const solicitudController = require('../controllers/solicitudController');

// Obtener solicitudes pendientes
router.get('/', solicitudController.getSolicitud);

// Crear nueva solicitud (esto es lo que necesita el frontend)
router.post('/', solicitudController.crearSolicitud);

// Aceptar solicitud por ID
router.post('/:id/aceptar', solicitudController.aceptarSolicitud);

// Rechazar solicitud por ID
router.post('/:id/rechazar', solicitudController.eliminarSolicitud);

module.exports = router;
