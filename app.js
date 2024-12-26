const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Asegúrate de incluir path si no está ya importado
require('dotenv').config();

const userRoutes = require('./routes/users');
const exerciseRoutes = require('./routes/exercises');

const app = express();

app.use(cors());
// Middleware para servir archivos estáticos desde 'public' (como el style.css)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para servir el archivo HTML desde 'views'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html')); // Asegúrate de que index.html esté en la carpeta 'views'
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Conexión a MongoDB exitosa"))
  .catch(err => {
    console.error("Error de conexión a MongoDB:", err.message);
  });

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/users', exerciseRoutes);
app.use('/api/exercises', exerciseRoutes);

// Arrancar el servidor
const listener = app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${listener.address().port}`);
});
