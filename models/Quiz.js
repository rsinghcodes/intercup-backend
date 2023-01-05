const { Schema, model } = require('mongoose');

const quizSchema = new Schema({
  topic: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
    unique: true,
  },
  options: [{ type: String }],
  answer: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    default: 1,
  },
});

module.exports = model('Quiz', quizSchema);
