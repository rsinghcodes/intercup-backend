const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: '1d',
    }
  );
};

const verifyToken = async (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, payload) => {
      if (err) return reject(err);

      resolve(payload);
    });
  });
};

module.exports = {
  createToken,
  verifyToken,
};
