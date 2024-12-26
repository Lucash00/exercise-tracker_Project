const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
});

module.exports = mongoose.model('Exercise', exerciseSchema);
