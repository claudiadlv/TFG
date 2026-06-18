const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;

// Encriptar la contraseña al registrar usuario
const hashearContrasena = async (contrasenaPlana) => {
  return await bcrypt.hash(contrasenaPlana, SALT_ROUNDS);
};

// Comparar contraseñas en el Login
const compararContrasena = async (contrasenaPlana, contrasenaHasheada) => {
  return await bcrypt.compare(contrasenaPlana, contrasenaHasheada);
};

module.exports = {
  hashearContrasena,
  compararContrasena
};