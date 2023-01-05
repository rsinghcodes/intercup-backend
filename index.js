const express = require('express');
const morgan = require('morgan');
// database
const connect = require('./database/connect');
// routes
const admin = require('./routes/admin');
const user = require('./routes/user');
const auth = require('./routes/auth');
const questions = require('./routes/questions');
const quiz = require('./routes/quiz');

const { MONGODB, NODE_ENV, PORT } = require('./config.js');

const app = express();

app.use(express.json());

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/admin', admin);
app.use('/api/user', user);
app.use('/api/auth/user', auth);
app.use('/api/questions', questions);
app.use('/api/quiz', quiz);

app.listen(PORT, async () => {
  console.log(`Server running on ${NODE_ENV} mode on port ${PORT}`);
  await connect(MONGODB);
});
