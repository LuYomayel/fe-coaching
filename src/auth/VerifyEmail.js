import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import '../styles/VerifyEmail.css'
const apiUrl = process.env.REACT_APP_API_URL;

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
      const data = await response.json();
      console.log(data)
      if (response.ok) {
        setStatus('Email verified successfully!');
      } else {
        setStatus('Email verification failed.');
      }
    } catch (error) {
      setStatus('An error occurred while verifying your email.');
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