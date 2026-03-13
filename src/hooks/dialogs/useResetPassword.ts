import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api-client';

interface UseResetPasswordProps {
  email: string;
  verificationCode: string;
  onSuccess?: (newPassword: string) => void;
}

export const useResetPassword = ({ email, verificationCode, onSuccess }: UseResetPasswordProps) => {
  const intl = useIntl();
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const reset = useCallback(() => {
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsResetting(false);
  }, []);

  const validate = useCallback(() => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      newErrors.newPassword = intl.formatMessage({ id: 'resetPassword.error.passwordRequired' });
    } else if (newPassword.length < 6) {
      newErrors.newPassword = intl.formatMessage({ id: 'resetPassword.error.passwordTooShort' });
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = intl.formatMessage({ id: 'resetPassword.error.confirmPasswordRequired' });
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = intl.formatMessage({ id: 'resetPassword.error.match' });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [newPassword, confirmPassword, intl]);

  const resetPassword = useCallback(async () => {
    if (!validate()) {
      return false;
    }

    setIsResetting(true);
    try {
      // El backend espera el código de verificación como token
      await api.auth.resetPassword({ email, token: verificationCode, newPassword });

      showToast(
        'success',
        intl.formatMessage({ id: 'home.toast.success' }),
        intl.formatMessage({ id: 'resetPassword.success' })
      );

      if (onSuccess) {
        onSuccess(newPassword);
      }

      return true;
    } catch (error) {
      console.error('Reset password error', error);
      showToast('error', intl.formatMessage({ id: 'home.toast.error' }), (error as Error).message);
      return false;
    } finally {
      setIsResetting(false);
    }
  }, [validate, verificationCode, newPassword, intl, onSuccess, showToast]);

  const handleNewPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(event.target.value);
    if (errors.newPassword) {
      setErrors((prev) => ({ ...prev, newPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  return {
    newPassword,
    confirmPassword,
    isResetting,
    errors,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    resetPassword,
    reset
  };
};
