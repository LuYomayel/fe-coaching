import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';

import { useToast } from '../../contexts/ToastContext';

export const useVerificationCodeForm = ({ email, onSuccess } = {}) => {
  const intl = useIntl();
  const { showToast } = useToast();

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const reset = useCallback(() => {
    setCode('');
    setIsVerifying(false);
    setIsResending(false);
  }, []);

  const verifyCode = useCallback(async () => {
    if (!code) {
      showToast(
        'error',
        intl.formatMessage({ id: 'home.toast.error' }),
        intl.formatMessage({ id: 'verification.error.codeRequired' })
      );
      return false;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/verify-email?email=${encodeURIComponent(email)}&code=${code}`
      );
      const data = await response.json();

      if (data.message === 'success') {
        showToast(
          'success',
          intl.formatMessage({ id: 'home.toast.success' }),
          intl.formatMessage({ id: 'verification.success' })
        );
        if (onSuccess) {
          await onSuccess();
        }
        reset();
        return true;
      } else {
        throw new Error(data.error || intl.formatMessage({ id: 'verification.error.invalidCode' }));
      }
    } catch (error) {
      console.error('Verification error', error);
      showToast('error', intl.formatMessage({ id: 'home.toast.error' }), error.message);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [code, email, intl, onSuccess, reset, showToast]);

  const resendCode = useCallback(async () => {
    setIsResending(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.message || intl.formatMessage({ id: 'home.verification.resendError' }));
      }

      showToast(
        'success',
        intl.formatMessage({ id: 'home.toast.success' }),
        intl.formatMessage({ id: 'home.verification.resendSuccess' })
      );
      return true;
    } catch (error) {
      console.error('Resend verification error', error);
      showToast('error', intl.formatMessage({ id: 'home.toast.error' }), error.message);
      return false;
    } finally {
      setIsResending(false);
    }
  }, [email, intl, showToast]);

  const handleCodeChange = (event) => setCode(event.target.value);

  return {
    code,
    isVerifying,
    isResending,
    handleCodeChange,
    verifyCode,
    resendCode,
    reset
  };
};

export default useVerificationCodeForm;
