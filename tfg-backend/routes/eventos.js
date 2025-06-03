const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');

// Endpoints
router.post('/', eventosController.crearEvento);
router.get('/', eventosController.obtenerEventos);
router.get('/todos', eventosController.obtenerEventos); 
router.delete('/:id', eventosController.eliminarEvento);
router.put('/:id', eventosController.modificarEvento);

module.exports = router;