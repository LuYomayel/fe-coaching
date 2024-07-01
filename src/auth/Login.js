import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import {jwtDecode} from 'jwt-decode';

const apiUrl = process.env.REACT_APP_API_URL;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data) {
        localStorage.setItem('token', data.access_token);
        const decodedToken = jwtDecode(data.access_token);
        console.log(decodedToken)
        if(decodedToken.userType === 'client'){
          navigate('/student')
        }else{
          navigate('/coach'); // Cambia esto por la ruta de tu dashboard
        }
      } else {
        
      }
    } catch (error) {
      
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <Card title="Login">
        <div className="p-field">
          <label htmlFor="email">Email</label>
          <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="p-field">
          <label htmlFor="password">Password</label>
          <Password id="password" value={password} onChange={(e) => setPassword(e.target.value)} toggleMask />
        </div>
        <Button label="Login" icon="pi pi-sign-in" loading={loading} onClick={handleLogin} />
      </Card>
    </div>
  );
};

export default Login;