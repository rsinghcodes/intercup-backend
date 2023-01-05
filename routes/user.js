const express = require('express');
const crypto = require('crypto');

const User = require('../models/User');
const Token = require('../models/Token');
const { validateSignUp, ValidateLogin } = require('../validation/validation');
const sendEmail = require('../utils/sendEmail');
const authenticatedMiddleware = require('../middleware/authenticated');
const { BASE_URL } = require('../config');
const { createToken } = require('../middleware/token');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { errors, isValid } = validateSignUp(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    // checks, if email already exists
    let user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(400).json({ email: 'Email already exists' });
    }

    const { fullname, email, password, highest_score, profession, college } =
      req.body;

    // Save mentee details
    user = await User.create({
      fullname,
      email,
      password,
      highest_score,
      profession,
      college,
    });

    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString('hex'),
    }).save();

    const url = `${BASE_URL}/auth/user/${user.id}/verify/${token.token}`;

    await sendEmail(user.fullname, user.email, 'Account Activation Link', url);

    return res
      .status(201)
      .json({ message: 'An Email has been sent, please verify' });
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { errors, isValid } = ValidateLogin(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        email: 'Unable to find user with that email address',
      });
    }

    if (await user.isValidPassword(password)) {
      if (!user.isVerified) {
        let token = await Token.findOne({ userId: user._id });

        if (!token) {
          token = await new Token({
            userId: user._id,
            token: crypto.randomBytes(32).toString('hex'),
          }).save();

          const url = `${BASE_URL}/auth/user/${user.id}/verify/${token.token}`;

          await sendEmail(
            user.fullname,
            user.email,
            'Account Activation Link',
            url
          );

          return res
            .status(403)
            .json({ message: 'An Email has been sent, please verify' });
        } else {
          return res.status(403).json({
            message: 'An Email has been sent, please verify',
          });
        }
      } else if (!user.isAccess) {
        return res.status(403).json({
          message: 'Your account access has been denied!',
        });
      } else {
        const accessToken = createToken(user);

        return res.status(200).json({ accessToken });
      }
    } else {
      return res.status(400).json({ password: 'Password is incorrect' });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

router.get('/profile', authenticatedMiddleware, async (req, res) => {
  try {
    const profile = await User.findById(req.user._id)
      .select('-password')
      .exec();

    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

router.get('/get-favorites', authenticatedMiddleware, async (req, res) => {
  try {
    const favoritesQues = await User.findById(req.user._id)
      .populate('favorites')
      .exec();

    return res.status(200).json(favoritesQues);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

router.patch('/add-favorite', authenticatedMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { favorites: req.body.questionId },
      },
      { new: true }
    ).exec();

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

router.patch('/delete-favorite', authenticatedMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { favorites: req.body.questionId },
      },
      { new: true }
    ).exec();

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

router.delete('/:id', authenticatedMiddleware, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if ((user && user._id == req.user.id) || req.user.role == 'admin') {
      user = await user.remove();

      return res.status(200).json({
        user,
      });
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

router.put('/:id', authenticatedMiddleware, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if ((user && user._id == req.user.id) || req.user.role == 'admin') {
      user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });

      const accessToken = createToken(user);

      return res.status(200).json({ user, accessToken });
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

module.exports = router;
