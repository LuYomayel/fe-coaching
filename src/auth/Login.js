import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { UserContext } from '../utils/UserContext';
import { useToast } from '../utils/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import {jwtDecode} from 'jwt-decode';
import '../index.css'
import { fetchClient, fetchCoach } from '../services/usersService';
const apiUrl = process.env.REACT_APP_API_URL;

const Login = () => {
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setLoading, loading } = useSpinner();
  const [isSignUp, setIsSignUp] = useState(false);
  const { setUser, setClient, setCoach } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      if(!decodedToken.isVerified){
        showToast('error', 'Verify your email prior loging in!', 'Check your email to verify it, please')
      }else{
        setUser(decodedToken);
        if (decodedToken.userType === 'client') {
          navigate('/student');
        } else {
          navigate('/coach');
        }
      }
    }
  }, [navigate, setUser]);

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
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData.message)
        throw new Error(errorData.message.message || 'Something went wrong');
      }
      const data = await response.json();
      setLoading(false);
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        const decodedToken = jwtDecode(data.access_token);
        setUser(decodedToken);
        if(!decodedToken.isVerified){
          showToast('error', 'Verify your email prior loging in!', 'Check your email to verify it, please')
        }else{
          try {
            if (decodedToken.userType === 'coach') {
              try {
                const coachData = await fetchCoach(decodedToken.userId);
                setCoach(coachData);
                navigate('/coach');
              } catch (error) {
                console.error(error);
                setCoach(null);
                navigate('/complete-coach-profile');
              }
            } else if (decodedToken.userType === 'client') {
              try {
                const clientData = await fetchClient(decodedToken.userId);
                setClient(clientData);
                navigate('/student');
              } catch (error) {
                console.error(error);
                setClient(null);
                navigate('/');
              }
            }
          } catch (error) {
            showToast('error', 'Error', error.message);
          }
        }
      }
    } catch (error) {
      // Handle login error
      showToast('error', 'Error', error.message);
      setLoading(false);
    }
    
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/signUp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        throw new Error(errorData.message || 'Something went wrong');
      }
      else{
        setLoading(false);
        const data = await response.json();
        if(data.statusCode && data.statusCode !== 200){
          showToast('error', 'Error signing up', data.message)
        } else {
          showToast('success', 'Check your email to continue!')
        }
      }
    } catch (error) {
      // Handle signup error
      showToast('error', 'Error', error.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
    
  };

  return (
    <div className="flex flex-column align-items-center justify-content-center">
      <div className="h1 p-5">
        <h1 className="h1"> Welcome! </h1>
      </div>
      <div className="login-container responsive-card">
        <Card title={isSignUp ? 'Sign Up' : 'Login'}>
          <div className="p-field">
            <label htmlFor="email">Email</label>
            <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="p-field">
            <label htmlFor="password">Password</label>
            <Password id="password" value={password} onChange={(e) => setPassword(e.target.value)} toggleMask />
          </div>
          <div className="flex align-items-center justify-content-center gap-1 pt-4">
            {isSignUp ? (
              <Button label="Sign Up" icon="pi pi-user" loading={loading} onClick={handleSignUp} />
            ) : (
              <Button label="Login" icon="pi pi-sign-in" loading={loading} onClick={handleLogin} />
            )}
            <Button
              label={isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
              className="p-button-text"
              onClick={() => setIsSignUp(!isSignUp)}
            />
          </div>
          {!isSignUp && (
            <div className="flex align-items-center justify-content-center pt-2">
              <Button
                label="Forgot Password?"
                className="p-button-text"
                onClick={() => navigate('/forgot-password')}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Login;