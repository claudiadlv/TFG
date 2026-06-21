const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const { verifyToken } = require('../middleware/authMiddleware');

//Rutas estaticas
// --- Generales ---
router.post('/', eventosController.crearEvento);
router.get('/todos', eventosController.obtenerEventos);
router.get('/filtrados', verifyToken, eventosController.getEventosFiltradosPorCategorias);

// --- Entrenador ---
router.get('/entrenador/mios', verifyToken, eventosController.getEventosDeMiCategoria);
router.get('/entrenador/asistencias', verifyToken, eventosController.getAsistenciasEntrenador);

// --- Padre ---
router.get('/padre/asistencias', verifyToken, eventosController.getAsistenciasPadre);
router.get('/apuntados', verifyToken, eventosController.getEventosApuntados);

// --- Admin ---
router.get('/admin/asistencias', verifyToken, eventosController.getAsistenciasAdmin);

//Rutas con parametros intermedios

router.get('/viaje/:viajeId/pasajeros', verifyToken, eventosController.getPasajerosViaje);
router.get('/padre/evento/:id', verifyToken, eventosController.obtenerDetalleEventoPadre);

//Rutas dinamicas
// --- Acciones de asistencia e inscripción ---
router.get('/:id/inscritos', verifyToken, eventosController.getInscritosEvento);
router.get('/:id/apuntado', verifyToken, eventosController.estaApuntado);
router.post('/:id/apuntar', verifyToken, eventosController.apuntarDeportistaAEvento);
router.delete('/:id/desapuntar', verifyToken, eventosController.desapuntarDeportistaDeEvento);
router.put('/:id/transporte-hijo', verifyToken, eventosController.actualizarTransporteHijo);

// --- CRUD básico de Eventos ---
router.put('/:id', eventosController.modificarEvento);
router.delete('/:id', eventosController.eliminarEvento);

module.exports = router;