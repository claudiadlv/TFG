// db.js usando mysql2 (permite callbacks y promesas)
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'tfg2025',
  database: 'tfg',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Creamos una versión del pool que maneja Promesas
const promisePool = pool.promise();

// Exportamos el pool normal por defecto (para tus callbacks)
// y el promisePool de forma nombrada (para tus nuevos controladores)
module.exports = {
  pool,
  promisePool
};