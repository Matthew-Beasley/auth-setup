import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';
import axios from 'axios';
import qs from 'qs';
const root = document.querySelector('#root');


const App = ()=> {
  const [auth, setAuth] = useState({});

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

  const logout = () => {
    window.localStorage.removeItem('token');
    setAuth({});
    setUsername('');
    setPassword('');
  }

  const onSubmit = async(ev)=> {
    ev.preventDefault();
    const credentials = {
      username,
      password
    };
    //console.log(credentials);  
    const response = await axios.post('/api/auth', credentials);
    //console.log(response.data.token)
    window.localStorage.setItem('token', response.data.token);
    findUserFromToken(response.data.token);
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
    </div>
  );
};

render(<App />, root); 
