import { useState } from 'react';

export const useVerificationDialog = ({ onVerified } = {}) => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');

  const open = (emailToVerify) => {
    setEmail(emailToVerify);
    setVisible(true);
  };

  const close = () => setVisible(false);

  const handleSuccess = () => {
    close();
    if (onVerified) {
      onVerified();
    }
  };

  return {
    visible,
    email,
    open,
    close,
    handleSuccess
  };
};
