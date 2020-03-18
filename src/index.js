/* eslint-disable react/jsx-key */
import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';
import axios from 'axios';
import qs from 'qs';
const root = document.querySelector('#root');


const App = ()=> {
  const [auth, setAuth] = useState({});
  const [userList, setUserList] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
      findUserFromToken();
  }, [])

  const findUserFromToken = async () => {
    const token = window.localStorage.getItem('token');
    const response = await axios.get('/api/auth', {
      headers: {
        authentication: token
      }
    });
    setAuth(response.data);
  }

  const getUserList = async (token) => {
    const response = await axios.get('/api/admin', {
      headers: {
        authentication: token
      }
    });
    console.log(response.data)
    setUserList(response.data);
  }

  const logout = () => {
    window.localStorage.removeItem('token');
    setAuth({});
    setUsername('');
    setPassword('');
    setUserList([]);
  }

  const onSubmit = async(ev)=> {
    ev.preventDefault();
    const credentials = {
      username,
      password
    };
    const response = await axios.post('/api/auth', credentials);
    window.localStorage.setItem('token', response.data.token);
    findUserFromToken(response.data.token);
    getUserList(response.data.token)
  };

  return (
    <div>
      <h1>Auth App</h1>
      {
        !auth.id &&  (
          <form onSubmit={ onSubmit }>
            <h2>Login</h2>
            <div className='error'>{ error }</div>
            <input value={ username } onChange={ ev => setUsername(ev.target.value )}/>
            <input type='password' value={ password } onChange={ ev => setPassword(ev.target.value )}/>
            <button>Save</button>
          </form>
        )
      }
      {
        auth.id && <button onClick={ logout }>Logout { auth.username }</button>
      }
      {
        <ul>
          {userList.map((user, idx) => {
            return (
              <li>{user.username}</li>
            )
          })}
        </ul>
      }
    </div>
  );
};

render(<App />, root); 
