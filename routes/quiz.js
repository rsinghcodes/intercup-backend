const express = require('express');

const authenticatedMiddleware = require('../middleware/authenticated');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { validateQuestionInput } = require('../validation/validation');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const quiz = await Quiz.find();

    return res.status(200).json(quiz);
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

router.get('/:topicname', async (req, res) => {
  try {
    const quiz = await Quiz.find({ topic: req.params.topicname });

    return res.status(200).json(quiz);
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

router.post('/new', authenticatedMiddleware, async (req, res) => {
  try {
    if (req.user.role == 'admin') {
      const { errors, isValid } = validateQuestionInput(req.body);

      if (!isValid) {
        return res.status(400).json(errors);
      }

      // checks, if question already exists
      let quiz = await Quiz.findOne({ question: req.body.question });

      if (quiz) {
        return res.status(400).json({ question: 'Question already exists' });
      }

      // Save new question
      quiz = await Quiz.create(req.body);

      return res.status(201).json(quiz);
    } else {
      return res.status(403).json({
        error: 'Action not allowed',
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

router.delete('/:id', authenticatedMiddleware, async (req, res) => {
  try {
    if (req.user.role == 'admin') {
      let quiz = await Quiz.findById(req.params.id);

      // checks, if employee exists or not
      if (!quiz) {
        return res.status(404).json({
          error: 'No question found!',
        });
      }

      quiz = await quiz.remove();

      return res.status(200).json(quiz);
    } else {
      return res.status(403).json({
        error: 'Action not allowed',
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

// Update question from database by id
router.put('/:id', authenticatedMiddleware, async (req, res) => {
  try {
    if (req.user.role == 'admin') {
      let quiz = await Quiz.findById(req.params.id);

      // checks, if question exists or not
      if (!quiz) {
        return res.status(404).json({
          error: 'No question found!',
        });
      }

      const { errors, isValid } = validateQuestionInput(req.body);

      if (!isValid) {
        return res.status(400).json(errors);
      }

      quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });

      return res.status(201).json(quiz);
    } else {
      return res.status(403).json({
        error: 'Action not allowed',
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

router.patch('/increase-score', authenticatedMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { highest_score: req.body.highest_score },
      },
      { new: true }
    ).exec();

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

module.exports = router;
