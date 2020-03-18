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

const isLoggedIn = (req, res, next) => {
  if (!req.user) {
    const err = Error('Not authenticated');
    next(err);
  } else {
    next();
  }
}

app.get('/', (req, res, next) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    const token = await db.authenticate(req.body);
    res.send({ token });
  } catch (error) {
    next(error);
  }

});

app.get('/api/auth', isLoggedIn, (req, res, next) => {
  
  res.send(req.user)
});

app.get('/api/admin', isLoggedIn, async (req, res, next) => {
  try {
    const data = await db.getAllUsers();
    res.send(data);
  } catch (error) {
    next(error);
  }
})

app.use((err, req, res, next)=> {
  res.status(err.status || 500).send({ message: err.message});
});


db.sync()
  .then(()=> {
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> {
      console.log(port);
    });
  });
