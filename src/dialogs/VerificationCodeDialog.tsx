import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useIntl, FormattedMessage } from 'react-intl';
import { useToast } from '../utils/ToastContext';
import { authService } from '../services/authService';

const VerificationCodeDialog = ({ visible, onHide, email, onVerificationSuccess }) => {
  const intl = useIntl();
  const showToast = useToast();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerification = async () => {
    if (!verificationCode) {
      showToast('error', 'Error', intl.formatMessage({ id: 'verification.error.codeRequired' }));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/verify-email?email=${email}&code=${verificationCode}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...authService.getAuthHeaders()
          }
        }
      );

      const data = await response.json();

      if (data.message === 'success') {
        showToast('success', 'Success', intl.formatMessage({ id: 'verification.success' }));
        onVerificationSuccess();
        onHide();
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/send-verification-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || 'Error resending verification code');
      } else {
        showToast('success', 'Success', intl.formatMessage({ id: 'home.verification.resendSuccess' }));
      }
    } catch (error) {
      showToast('error', 'Error', intl.formatMessage({ id: 'home.verification.resendError' }));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Dialog
      header={intl.formatMessage({ id: 'verification.title' })}
      visible={visible}
      onHide={onHide}
      style={{ width: '90%', maxWidth: '400px' }}
      className="border-round-2xl"
      modal
    >
      <div className="p-fluid">
        <div className="field">
          <p className="mb-3">
            <FormattedMessage
              id="verification.message"
              values={{
                email: <strong>{email}</strong>
              }}
            />
          </p>
          <label htmlFor="verificationCode" className="block text-900 font-medium mb-2">
            <FormattedMessage id="verification.code" />
          </label>
          <InputText
            id="verificationCode"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full p-inputtext-lg"
            placeholder={intl.formatMessage({ id: 'verification.codePlaceholder' })}
          />
        </div>
        <div className="flex flex-column gap-2">
          <Button
            label={intl.formatMessage({ id: 'verification.verify' })}
            className="p-button-lg w-full"
            onClick={handleVerification}
            loading={loading}
          />
          <Button
            label={intl.formatMessage({ id: 'home.verification.resend' })}
            className="p-button-outlined p-button-secondary w-full"
            onClick={handleResendCode}
            loading={resendLoading}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default VerificationCodeDialog;
