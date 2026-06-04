const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const { verifyToken } = require('../middleware/authMiddleware');

// ==========================================
// 1. RUTAS ESTÁTICAS (Sin parámetros dinámicos en el primer nivel)
// ==========================================

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

// ==========================================
// 2. RUTAS CON PARÁMETROS INTERMEDIOS O ESPECÍFICOS
// ==========================================

router.get('/viaje/:viajeId/pasajeros', verifyToken, eventosController.getPasajerosViaje);
router.get('/padre/evento/:id', verifyToken, eventosController.obtenerDetalleEventoPadre);


// ==========================================
// 3. RUTAS DINÁMICAS (Con :id al principio. Siempre al final del archivo)
// ==========================================

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