const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/users');
const exerciseRoutes = require('./routes/exercises');


const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Conexión a MongoDB exitosa"))
  .catch(err => {
    console.error("Error de conexión a MongoDB:", err.message);
  });

app.use('/api/users', userRoutes);
app.use('/api/users', exerciseRoutes);

app.use('/api/exercises', exerciseRoutes);


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
