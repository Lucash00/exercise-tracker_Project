const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Inicializar la aplicación
const app = express();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());  // Para manejar las solicitudes POST con datos en formato JSON

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Conexión a MongoDB exitosa"))
  .catch(err => {
    console.error("Error de conexión a MongoDB:", err.message); // Mostrar el mensaje de error detallado
    console.error("Detalles del error:", err); // Mostrar el objeto de error completo
  });

// Definir el esquema de Usuario con una transformación en JSON
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }] // Campo para almacenar ejercicios
});

// Agregar una transformación para los ObjectIds
userSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    // Si el objeto tiene un _id, lo transformamos a una cadena sin $oid
    ret._id = ret._id.toString(); // Convierte ObjectId en string
    // Transformar los ejercicios de ObjectId a cadena también
    if (ret.exercises) {
      ret.exercises = ret.exercises.map(id => id.toString());
    }
    return ret;
  }
});

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: String
});

// Modelos de Usuario y Ejercicio
const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Crear un nuevo usuario
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  
  const user = new User({ username });
  user.save()
    .then(user => res.json({ username: user.username, _id: user._id }))
    .catch(err => res.status(500).json({ error: 'Error al crear el usuario' }));
});

// Obtener todos los usuarios
app.get('/api/users', (req, res) => {
  console.log("Obteniendo usuarios...");
  User.find().lean() // Usamos .lean() para obtener objetos planos
    .then(users => {
      // Formatear los _id y ejercicios como cadenas
      users.forEach(user => {
        user._id = user._id.toString();
        user.exercises = user.exercises.map(id => id.toString());
      });
      res.json(users);
    })
    .catch(err => {
      console.error("Error al obtener los usuarios:", err);
      res.status(500).json({ error: 'Error al obtener los usuarios' });
    });
});

// Agregar un ejercicio a un usuario
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  // Si no se pasa una fecha, usar la fecha actual
  const exerciseDate = date || new Date().toDateString();

  const exercise = new Exercise({ description, duration, date: exerciseDate });
  
  exercise.save() // Primero guardamos el ejercicio
    .then(savedExercise => {
      User.findById(_id)
        .then(user => {
          if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
          }
          
          // Asociamos el ejercicio con el usuario
          user.exercises.push(savedExercise._id);
          return user.save();
        })
        .then(user => {
          // Respondiendo con los ObjectId como strings
          res.json({
            username: user.username,
            _id: user._id.toString(),
            description,
            duration,
            date: exerciseDate
          });
        })
        .catch(err => res.status(500).json({ error: 'Error al agregar el ejercicio al usuario' }));
    })
    .catch(err => res.status(500).json({ error: 'Error al guardar el ejercicio' }));
});

// Obtener el registro de ejercicios de un usuario
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const query = {};

  // Aseguramos que las fechas sean correctamente formateadas
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);  // Aseguramos que la fecha 'from' sea un objeto Date
    if (to) query.date.$lte = new Date(to);      // Aseguramos que la fecha 'to' sea un objeto Date
  }

  // Buscamos al usuario por su _id y usamos populate() para obtener los ejercicios
  User.findById(_id)
    .populate('exercises')  // Esta línea es importante: 'populate()' para obtener los ejercicios completos
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Ahora, 'user.exercises' debería contener los ejercicios completos
      const exercises = user.exercises.filter(exercise => {
        // Filtramos los ejercicios basados en el rango de fechas si es necesario
        if (from || to) {
          const exerciseDate = new Date(exercise.date);
          if (from && exerciseDate < new Date(from)) return false;
          if (to && exerciseDate > new Date(to)) return false;
        }
        return true;
      }).slice(0, limit || user.exercises.length);  // Aplicamos el límite si es necesario

      res.json({
        username: user.username,
        _id: user._id.toString(),
        count: exercises.length,
        log: exercises.map(exercise => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date // Mantenemos la fecha tal cual
        }))
      });
    })
    .catch(err => {
      console.error('Error al obtener el usuario:', err);
      res.status(500).json({ error: 'Error al obtener el usuario' });
    });
});


// Obtener un ejercicio por su ID
app.get('/api/exercises/:id', (req, res) => {
  const { id } = req.params;

  // Buscar el ejercicio por su ID
  Exercise.findById(id)
    .then(exercise => {
      if (!exercise) {
        return res.status(404).json({ error: 'Ejercicio no encontrado' });
      }

      // Devolver los detalles del ejercicio
      res.json({
        _id: exercise._id,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      });
    })
    .catch(err => {
      console.error('Error al obtener el ejercicio:', err);
      res.status(500).json({ error: 'Error al obtener el ejercicio' });
    });
});


// Iniciar el servidor
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
