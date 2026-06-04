//Punto de entrada del servidor Express 
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
require('dotenv').config();


const usuariosRoutes = require('./routes/usuarios');
const authRoutes = require('./routes/autorizacion');
const eventosRoutes = require('./routes/eventos');
const fotosRoutes = require('./routes/fotos');
const solicitudRoutes = require('./routes/solicitud');
const deportistaRoutes = require('./routes/deportista');
const entrenadoresRouter = require('./routes/entrenadores');
const transporteRoutes = require('./routes/transporte');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/usuarios', usuariosRoutes);
app.use('/auth', authRoutes); 
app.use('/eventos', eventosRoutes);
app.use('/api/fotos', fotosRoutes);
app.use('/solicitudes-registro', solicitudRoutes);
app.use('/deportista', deportistaRoutes);
app.use('/admin/entrenadores', entrenadoresRouter);
app.use('/transporte', transporteRoutes);

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running at http://0.0.0.0:3000');
});
