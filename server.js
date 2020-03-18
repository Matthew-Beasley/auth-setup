const express = require('express');
const app = express();
const path = require('path');
app.use(express.json());

const db = require('./db');

app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(async (req, res, next) => {
  if (!req.headers.authentication) {
    next();
  } else {
    try {
      req.user = await db.findUserFromToken(req.headers.authentication);
      next();
    } catch (error) {
      next(error);
    }
  }
});

app.get('/', (req, res, next) => res.sendFile(path.join(__dirname, 'index.html')));

const isLoggedIn = (req, res, next) => {
  if (!req.user) {
    const err = Error('Not authenticated');
    next(err);
  } else {
    next();
  }
}

const isAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    const err = Error('Not admin');
    next(err);
  }
}

app.post('/api/auth', async (req, res, next) => {
  try {
    const token = await db.authenticate(req.body);
    res.send({ token });
  } catch (error) {
    next(error);
  }

});

app.get('/api/auth', isLoggedIn, (req, res, next) => {
  try {
    console.log(req.user)
    res.send(req.user);
  } catch (error) {
    next(error)
  }
});

app.get('/api/admin', isAdmin, async (req, res, next) => {
  try {
    console.log()
    const data = await db.getAllUsers();
    res.send(data);
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  next();
})

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ message: err.message});
});


db.sync()
  .then(()=> {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(port);
    });
  });
