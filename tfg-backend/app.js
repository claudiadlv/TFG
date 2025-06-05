//Punto de entrada del servidor Express 
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;
require('dotenv').config();


const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/autorizacion');
const eventosRoutes = require('./routes/eventos');
const photosRoutes = require('./routes/photos');
const solicitudRoutes = require('./routes/solicitud');
//const deportistaRoutes = require('./routes/deportista');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/usuarios', usuariosRoutes);
app.use('/auth', authRoutes); 
app.use('/eventos', eventosRoutes);
app.use('/api/fotos', photosRoutes);
app.use('/solicitudes-registro', solicitudRoutes);
//app.use('/deportista', deportistaRoutes);

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running at http://0.0.0.0:3000');
});
