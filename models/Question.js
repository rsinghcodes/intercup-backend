const { Schema, model } = require('mongoose');

const questionSchema = new Schema({
  topic: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
    unique: true,
  },
  answer: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    default: 1,
  },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = model('Question', questionSchema);
