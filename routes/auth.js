const express = require('express');

const Token = require('../models/Token');
const User = require('../models/User');

const router = express.Router();

router.get('/:id/verify/:token/', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(400)
        .json({ error: 'Link has been expired or Invalid link' });
    }

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });

    if (!token)
      return res
        .status(400)
        .json({ error: 'Link has been expired or Invalid link' });

    await User.updateOne({ _id: user._id }, { isVerified: true });

    await token.remove();

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
