const { Client } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jwt-simple');

const client = new Client(process.env.DATABASE_URL || 'postgres://localhost/acme_auth_db');

client.connect();

const sync = async() => {
  const SQL = `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  DROP TABLE IF EXISTS users;
  CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    role VARCHAR(25) NOT NULL 
    CHECK (char_length(username) > 0)
  );
  `;
  await client.query(SQL);
  const [lucy, moe] = await Promise.all([
    createUser({ username: 'moe', password: 'MOE', role: 'admin'}),
    createUser({ username: 'lucy', password: 'LUCY', role: 'user' }),
    createUser({ username: 'curly', password: 'CURLY', role: 'user' })
  ]);
};


const findUserFromToken = async (token) => {
  const id = jwt.decode(token, process.env.JWT).id;
  return (await client.query('SELECT * FROM users WHERE id = $1', [id])).rows[0];
}


const readUsers = async () => {
  return (await client.query('SELECT * FROM users')).rows;
}


const compare = async ({ plain, hashed }) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plain, hashed, (err, result) => {
      if (err) {
        reject(err);
      } else if (result === true) {
        resolve(true);
      } else {
        reject(Error('Authentication failed'))
      }
    })
  })
}


const authenticate = async ({ username, password }) => {
  const sql = 'SELECT * FROM users WHERE username = $1';
  try {
    const user = (await client.query(sql, [username])).rows[0];
    await compare({ plain: password, hashed: user.password });
    return jwt.encode({ id: user.id, role: user.role }, process.env.JWT)
  } catch (err) {
    console.log(err);
  }
}

const getAllUsers = async () => {
  const sql = 'SELECT * FROM users';
  return (await client.query(sql)).rows;
}


const createUser = async({ username, password, role}) => {
  const hashed = await hash(password);
  const sql = `
  INSERT INTO users(username, password, role) 
  VALUES ($1, $2, $3) returning *`
  return (await client.query(sql, [ username, hashed, role])).rows[0];
};


const hash = (plain) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(plain, 10, (err, hashed) => {
      if (err) {
        reject(err);
      } else {
        resolve(hashed);
      }
    })
  })
}


module.exports = {
  sync,
  authenticate,
  findUserFromToken,
  getAllUsers
};
