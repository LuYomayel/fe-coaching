import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { useToast } from '../utils/ToastContext';
const apiUrl = process.env.REACT_APP_API_URL;

const ResetPassword = () => {
  const showToast = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast('error', 'Error', 'Passwords do not match');
      return;
    }

    // setLoading(true);
    try {
        const body = {
            token,
            newPassword
        }
        const response = await fetch(`${apiUrl}/auth/reset-password`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
          const errorData = await response.json();
          console.log(errorData)
          throw new Error(errorData.message || 'Something went wrong');
        }
        else{
            showToast('success', 'Success', 'Password reset successfully');
            navigate('/login');
        } 
    } catch (error) {
        console.log(error)
        showToast('error', 'Error', error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-column align-items-center justify-content-center">
      <div className="reset-password-container">
        <Card title="Reset Password">
          <div className="p-field">
            <label htmlFor="newPassword">New Password</label>
            <Password id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} toggleMask />
          </div>
          <div className="p-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <Password id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} toggleMask />
          </div>
          <div className='flex align-items-center justify-content-center gap-1 pt-4'>
            <Button label="Reset Password" icon="pi pi-check" loading={loading} onClick={handleResetPassword} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;