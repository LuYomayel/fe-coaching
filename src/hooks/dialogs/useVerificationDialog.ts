import { useState } from 'react';

interface IUseVerificationDialogProps {
  onVerified?: () => void;
}

export const useVerificationDialog = ({ onVerified }: IUseVerificationDialogProps = {}) => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');

  const open = (emailToVerify: string) => {
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
