import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api-client';

interface UseForgotPasswordVerificationProps {
  onSuccess?: (email: string, code: string) => void;
}

export const useForgotPasswordVerification = ({ onSuccess }: UseForgotPasswordVerificationProps = {}) => {
  const intl = useIntl();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const reset = useCallback(() => {
    setEmail('');
    setCode('');
    setCodeSent(false);
    setIsSendingCode(false);
    setIsVerifying(false);
    setIsResending(false);
  }, []);

  const sendVerificationCode = useCallback(async () => {
    if (!email) {
      showToast(
        'error',
        intl.formatMessage({ id: 'home.toast.error' }),
        intl.formatMessage({ id: 'forgotPassword.error.emailRequired' })
      );
      return false;
    }

    setIsSendingCode(true);
    try {
      await api.auth.forgotPassword({ email });
      showToast(
        'success',
        intl.formatMessage({ id: 'home.toast.success' }),
        intl.formatMessage({ id: 'forgotPassword.codeSent' })
      );
      setCodeSent(true);
      return true;
    } catch (error) {
      console.error('Send verification code error', error);
      showToast('error', intl.formatMessage({ id: 'home.toast.error' }), (error as Error).message);
      return false;
    } finally {
      setIsSendingCode(false);
    }
  }, [email, intl, showToast]);

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
      const { data } = await api.auth.verifyPasswordResetCode({ email, code });
      console.log('data', data);
      if (data) {
        showToast(
          'success',
          intl.formatMessage({ id: 'home.toast.success' }),
          intl.formatMessage({ id: 'forgotPassword.verificationSuccess' })
        );
        if (onSuccess) {
          onSuccess(email, code);
        }
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Verification error', error);
      showToast('error', intl.formatMessage({ id: 'home.toast.error' }), (error as Error).message);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [code, email, intl, onSuccess, showToast]);

  const resendCode = useCallback(async () => {
    setIsResending(true);
    try {
      await api.auth.forgotPassword({ email });
      showToast(
        'success',
        intl.formatMessage({ id: 'home.toast.success' }),
        intl.formatMessage({ id: 'home.verification.resendSuccess' })
      );
      return true;
    } catch (error) {
      console.error('Resend verification error', error);
      showToast('error', intl.formatMessage({ id: 'home.toast.error' }), (error as Error).message);
      return false;
    } finally {
      setIsResending(false);
    }
  }, [email, intl, showToast]);

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);
  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => setCode(event.target.value);

  return {
    email,
    code,
    codeSent,
    isSendingCode,
    isVerifying,
    isResending,
    handleEmailChange,
    handleCodeChange,
    sendVerificationCode,
    verifyCode,
    resendCode,
    reset
  };
};
