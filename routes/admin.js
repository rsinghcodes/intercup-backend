const express = require('express');
const crypto = require('crypto');

const Admin = require('../models/Admin');
const { ValidateLogin, validateSignUp } = require('../validation/validation');
const { createToken } = require('../middleware/token');
const authenticatedMiddleware = require('../middleware/authenticated');
const User = require('../models/User');
const Token = require('../models/Token');
const sendEmail = require('../utils/sendEmail');
const { BASE_URL } = require('../config');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { errors, isValid } = validateSignUp(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    // checks, if email already exists
    const admin = await Admin.findOne({ email: req.body.email });

    if (admin) {
      return res.status(400).json({ email: 'Email already exists' });
    }

    const { fullname, email, password } = req.body;

    // Save mentee details
    const user = await Admin.create({
      fullname,
      email,
      password,
    });

    const accessToken = createToken(user);

    return res.status(201).json({ accessToken });
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

    const user = await Admin.findOne({ email });

    if (!user) {
      return res.status(400).json({
        email: 'Unable to find user with that email address',
      });
    }

    if (await user.isValidPassword(password)) {
      const accessToken = createToken(user);

      return res.status(200).json({ accessToken });
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
    const profile = await Admin.findById(req.user._id)
      .select('-password')
      .exec();

    return res.status(200).json(profile);
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

router.get('/get-users', authenticatedMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const users = await User.find();

      return res.status(200).json(users);
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

router.post('/add-user', authenticatedMiddleware, async (req, res) => {
  try {
    // checks, if email already exists
    let user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(400).json({ email: 'Email already exists' });
    }

    // Save new user
    user = await User.create(req.body);

    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString('hex'),
    }).save();

    const url = `${BASE_URL}/auth/user/${user.id}/verify/${token.token}`;

    await sendEmail(user.fullname, user.email, 'Account Activation Link', url);

    return res.status(201).json({ user });
  } catch (error) {
    return res.status(500).json({
      error: 'Server Error',
    });
  }
});

router.get('/change-access/:id', authenticatedMiddleware, async (req, res) => {
  try {
    if (req.user.role == 'admin') {
      const user = await User.findOneAndUpdate(
        { _id: req.params.id },
        [{ $set: { isAccess: { $eq: [false, '$isAccess'] } } }],
        { new: true }
      );

      return res.status(200).json({ user });
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
