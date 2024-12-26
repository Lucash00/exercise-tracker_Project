const express = require('express');
const { createExercise, getExerciseLog, getExercisesByIds  } = require('../controllers/exerciseController');

const router = express.Router();

router.post('/:_id/exercises', createExercise);
router.get('/:_id/logs', getExerciseLog);
router.get('/getByIds', getExercisesByIds);


module.exports = router;
