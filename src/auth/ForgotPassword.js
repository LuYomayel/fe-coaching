import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
const apiUrl = process.env.REACT_APP_API_URL;

const ForgotPassword = () => {
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData)
        throw new Error(errorData.message || 'Something went wrong');
      }
      else{
        showToast('success', 'Success', 'Password reset link has been sent to your email.');
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-column align-items-center justify-content-center">
      <div className="forgot-password-container">
        <Card title="Forgot Password">
          <div className="p-field">
            <label htmlFor="email">Email</label>
            <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className='flex align-items-center justify-content-center gap-1 pt-4'>
            <Button label="Send Reset Link" icon="pi pi-envelope" loading={loading} onClick={handleForgotPassword} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;