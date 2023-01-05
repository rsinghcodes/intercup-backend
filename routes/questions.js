const express = require('express');

const authenticatedMiddleware = require('../middleware/authenticated');
const Question = require('../models/Question');
const { validateQuestionInput } = require('../validation/validation');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const questions = await Question.find();

    return res.status(200).json(questions);
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
      let question = await Question.findOne({ question: req.body.question });

      if (question) {
        return res.status(400).json({ question: 'Question already exists' });
      }

      // Save new question
      question = await Question.create(req.body);

      return res.status(201).json(question);
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
      let question = await Question.findById(req.params.id);

      // checks, if employee exists or not
      if (!question) {
        return res.status(404).json({
          error: 'No question found!',
        });
      }

      question = await question.remove();

      return res.status(200).json(question);
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
      let question = await Question.findById(req.params.id);

      // checks, if question exists or not
      if (!question) {
        return res.status(404).json({
          error: 'No question found!',
        });
      }

      const { errors, isValid } = validateQuestionInput(req.body);

      if (!isValid) {
        return res.status(400).json(errors);
      }

      question = await Question.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });

      return res.status(201).json(question);
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

router.patch('/like', authenticatedMiddleware, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.body.questionId,
      {
        $push: { likes: req.user._id },
      },
      { new: true }
    );

    return res.status(201).json(question);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

router.patch('/unlike', authenticatedMiddleware, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.body.questionId,
      {
        $pull: { likes: req.user._id },
      },
      { new: true }
    );

    return res.status(201).json(question);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

module.exports = router;
