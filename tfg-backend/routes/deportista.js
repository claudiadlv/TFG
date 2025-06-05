const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/authMiddleware');
const { getMisHijos } = require('../controllers/deportistaController');

router.get('/mis_hijos', verificarToken, getMisHijos);

module.exports = router;
