import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

import { useToast } from '../utils/ToastContext';
import '../styles/VerifyEmail.css'
const apiUrl = process.env.REACT_APP_API_URL;

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useToast();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      verifyEmail(token);
    } else {
      setStatus('Invalid verification link.');
    }
  }, [location]);

  const verifyEmail = async (token) => {
    try {
      const response = await fetch(`${apiUrl}/auth/verify-email?token=${token}`, {
        method: 'GET',
      });
     
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        setStatus('Email verification failed.');
        throw new Error(errorData.message || 'Something went wrong');
      }
      else {
        const data = await response.json();
        setStatus('Email verified successfully!');
      }
    } catch (error) {
      setStatus('An error occurred while verifying your email.');
      showToast('error', 'Error', error.message);
    }
  };

  return (
    <div className="verify-email-container">
      <Card title="Email Verification">
        <p>{status}</p>
        {status === 'Email verified successfully!' && (
          <Button label="Go to Login" icon="pi pi-sign-in" onClick={() => navigate('/')} />
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;