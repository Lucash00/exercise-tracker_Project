const User = require('../models/user');
const Exercise = require('../models/exercise');
const mongoose = require('mongoose'); // Importar mongoose

const createExercise = async (req, res) => {
    const { _id } = req.params;  // ID del usuario
    const { description, duration, date } = req.body;

    try {
        // Comprobamos que el usuario exista
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Si no se especifica fecha, usamos la actual
        const exerciseDate = date ? new Date(date).toDateString() : new Date().toDateString();

        // Creamos el ejercicio
        const newExercise = new Exercise({
            description,
            duration,
            date: exerciseDate
        });

        // Guardamos el ejercicio en la base de datos
        await newExercise.save();

        // Añadimos el ObjectId del ejercicio al usuario
        user.exercises.push(newExercise._id);

        // Guardamos el usuario con el ejercicio añadido
        await user.save();

        // Enviamos la respuesta con los datos del usuario y el ejercicio
        res.json({
            username: user.username,
            _id: user._id,
            exercise: {
                description,
                duration,
                date: exerciseDate
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al agregar el ejercicio" });
    }
};



const getExerciseLog = (req, res) => {
    const { _id } = req.params;
    const { from, to, limit } = req.query;

    // Buscar al usuario por ID
    User.findById(_id)
        .then(user => {
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            // Verificar si el usuario tiene ejercicios asociados
            if (!user.exercises || user.exercises.length === 0) {
                console.log("El usuario NO contiene ejercicios");
                return res.json({
                    username: user.username,
                    _id: user._id.toString(),
                    count: 0,
                    log: []
                });
            }

            // Verificar que exercises sea un array de ObjectId
            const exerciseIds = user.exercises.map(id => id.toString());
            console.log(exerciseIds); // Verifica que son ObjectId

            // Llamada a la función getExercisesByIds para buscar los ejercicios
            Exercise.find({ _id: { $in: exerciseIds } }) // $in buscará los ejercicios cuyo _id esté en el array de IDs
                .then(exercises => {
                    console.log(exercises);  // Verifica los resultados obtenidos
                    if (exercises.length === 0) {
                        return res.status(404).json({ error: 'No se encontraron ejercicios para los IDs proporcionados' });
                    }

                    // Filtrar y mapear los ejercicios
                    let filteredExercises = exercises.map(exercise => ({
                        description: exercise.description,
                        duration: exercise.duration,
                        date: new Date(exercise.date).toDateString()
                    }));

                    // Filtrar por rango de fechas si aplica
                    if (from) {
                        const fromDate = new Date(from);
                        // Asegúrate de eliminar la parte de la hora
                        fromDate.setHours(0, 0, 0, 0); // Establecer la hora a 00:00:00 para solo comparar la fecha
                        filteredExercises = filteredExercises.filter(ex => {
                            const exerciseDate = new Date(ex.date);
                            exerciseDate.setHours(0, 0, 0, 0); // Eliminar la hora de la fecha del ejercicio
                            return exerciseDate >= fromDate;
                        });
                    }


                    if (to) {
                        const toDate = new Date(to);
                        toDate.setHours(0, 0, 0, 0); // Establecer la hora a 00:00:00 para solo comparar la fecha

                        filteredExercises = filteredExercises.filter(ex => {
                            const exerciseDate = new Date(ex.date);
                            exerciseDate.setHours(0, 0, 0, 0); // Eliminar la hora de la fecha del ejercicio
                            return exerciseDate <= toDate;
                        });
                    }

                    // Limitar los resultados si se especifica un límite
                    if (limit) {
                        filteredExercises = filteredExercises.slice(0, parseInt(limit));
                    }

                    // Enviar la respuesta final
                    res.json({
                        username: user.username,
                        _id: user._id.toString(),
                        count: filteredExercises.length,
                        log: filteredExercises
                    });
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).json({ error: 'Error al obtener los ejercicios' });
                });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Error al obtener el usuario' });
        });
};



const getExercisesByIds = (req, res) => {
    const { _ids } = req.body; // Los IDs se enviarán en el cuerpo de la solicitud como un array

    if (!_ids || !Array.isArray(_ids)) {
        return res.status(400).json({ error: 'Se requiere un array de IDs' });
    }

    Exercise.find({ _id: { $in: _ids } }) // Busca ejercicios cuyos _id estén en el array
        .then(exercises => {
            if (exercises.length === 0) {
                return res.status(404).json({ error: 'No se encontraron ejercicios para los IDs proporcionados' });
            }
            res.json({
                count: exercises.length,
                exercises
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Error al obtener los ejercicios' });
        });
};




module.exports = { createExercise, getExerciseLog, getExercisesByIds };
