const express = require('express');
const router = express.Router();
const { guardarFoto, eliminarFoto } = require('../controllers/photosContoller');

router.post('/', guardarFoto);
router.delete('/:id', eliminarFoto);

module.exports = router;