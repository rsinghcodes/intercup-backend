require('dotenv').config();

module.exports = {
  MONGODB: process.env.MONGODB,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  BASE_URL: process.env.BASE_URL,
};
