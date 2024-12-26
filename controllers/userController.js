const User = require('../models/user');
const Exercise = require('../models/exercise');
const { ObjectId } = require('mongodb');  // Asegúrate de importar ObjectId

const createUser = (req, res) => {
  const { username, exerciseIds } = req.body;

  // Crear el nuevo usuario
  const newUser = new User({
    username,
    exercises: exerciseIds || []  // Inicializar con un array vacío si no se proporcionan ejercicios
  });

  // Si se proporcionan exerciseIds, verificamos que existan
  if (exerciseIds && exerciseIds.length > 0) {
      // Verificar si los ejercicios existen en la base de datos
      Exercise.find({ '_id': { $in: exerciseIds } })
          .then(exercises => {
              // Encontramos los ejercicios que no existen
              const foundExercisesIds = exercises.map(exercise => exercise._id.toString());
              const notFoundIds = exerciseIds.filter(id => !foundExercisesIds.includes(id));

              // Si hay ejercicios no encontrados, devolver error con los IDs faltantes
              if (notFoundIds.length > 0) {
                  return res.status(404).json({
                      error: `Los ejercicios: ${notFoundIds.join(', ')} . No se han encontrado`
                  });
              }

              // Si todos los ejercicios existen, agregar los exerciseIds al nuevo usuario
              newUser.exercises = exercises.map(exercise => exercise._id);

              // Guardar el usuario en la base de datos
              newUser.save()
                  .then(user => {
                      res.json({
                          username: user.username,
                          _id: user._id.toString(),
                          exercises: user.exercises || []  // Asegúrate de devolver los ejercicios
                      });
                  })
                  .catch(err => {
                      console.error(err);
                      res.status(500).json({ error: 'Error al crear el usuario' });
                  });
          })
          .catch(err => {
              console.error(err);
              res.status(500).json({ error: 'Error al verificar los ejercicios' });
          });
  } else {
      // Si no hay exerciseIds, simplemente guardamos el usuario sin ellos
      newUser.save()
          .then(user => {
              res.json({
                  username: user.username,
                  _id: user._id.toString(),
                  exercises: user.exercises || []  // Asegúrate de devolver los ejercicios
              });
          })
          .catch(err => {
              console.error(err);
              res.status(500).json({ error: 'Error al crear el usuario' });
          });
  }
};

const getUsers = (req, res) => {
  User.find().lean()
    .then(users => {
      users.forEach(user => {
        user._id = user._id.toString();
        user.exercises = user.exercises.map(id => id.toString());
      });
      res.json(users);
    })
    .catch(err => res.status(500).json({ error: 'Error al obtener los usuarios' }));
};

module.exports = { createUser, getUsers };
