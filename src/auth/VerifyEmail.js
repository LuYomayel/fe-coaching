import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

import { useToast } from '../utils/ToastContext';
import '../styles/VerifyEmail.css';
const apiUrl = process.env.REACT_APP_API_URL;

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useToast();
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    const verifyEmail = async (token) => {
      try {
        const response = await fetch(`${apiUrl}/auth/verify-email?token=${token}`, {
          method: 'GET'
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus('Email verification failed.');
          throw new Error(data.message || 'Error en la verificación del email');
        }

        setStatus('Email verified successfully!');
        showToast('success', 'Éxito', 'Email verificado correctamente');
      } catch (error) {
        setStatus('An error occurred while verifying your email.');
        showToast('error', 'Error', error.message);
      }
    };

    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (!token) {
      setStatus('Invalid verification link.');
      showToast('error', 'Error', 'Link de verificación inválido');
      return;
    }

    verifyEmail(token);
  }, [location.search, showToast, navigate]);

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
