const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User },
} = require('./db');
const path = require('path');
const JWT = require('jsonwebtoken');
const SECRET = process.env.JWT;

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({
      where: {
        username,
      },
    });
    if (user && user.verifyPassword(password)) {
      // generate token
      const token = await JWT.sign({ id: user.id }, SECRET);
      res.send({ token });
    } else {
      res.status(401).send('Incorrect credentials');
    }
    // res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', async (req, res, next) => {
  // 1. get the token from req.headers.authorization
  // 2. use the .verify method from jwt library to verify the token (takes a token and secret key as arguments)
  // 3. use the id from the token data to find the user
  try {
    const token = req.headers.authorization;
    res.send(await User.byToken(token));
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
