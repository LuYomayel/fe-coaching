import { useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useIntl, FormattedMessage } from 'react-intl';
import { useVerificationCodeForm } from '../../hooks/dialogs/useVerificationCodeForm';

interface IVerificationCodeDialogProps {
  visible: boolean;
  onHide: () => void;
  email: string;
  onVerificationSuccess?: () => Promise<void> | void;
}

const VerificationCodeDialog = ({ visible, onHide, email, onVerificationSuccess }: IVerificationCodeDialogProps) => {
  const intl = useIntl();
  const { code, handleCodeChange, isVerifying, isResending, verifyCode, resendCode, reset } = useVerificationCodeForm({
    email,
    onSuccess: onVerificationSuccess
  });

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible, reset]);

  const handleVerification = async () => {
    const success = await verifyCode();
    if (success) {
      onHide();
    }
  };

  return (
    <Dialog
      header={intl.formatMessage({ id: 'verification.title' })}
      visible={visible}
      onHide={onHide}
      draggable={false}
      dismissableMask
      resizable={false}
      className="border-round-2xl w-4/5 sm:w-11/12"
      style={{ width: 500 }}
      modal
    >
      <div className="p-fluid p-4">
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
            value={code}
            onChange={handleCodeChange}
            className="w-full p-inputtext-lg"
            placeholder={intl.formatMessage({ id: 'verification.codePlaceholder' })}
          />
        </div>
        <div className="flex flex-column gap-2">
          <Button
            label={intl.formatMessage({ id: 'verification.verify' })}
            className="p-button-lg w-full"
            onClick={handleVerification}
            loading={isVerifying}
          />
          <Button
            label={intl.formatMessage({ id: 'home.verification.resend' })}
            className="p-button-outlined p-button-secondary w-full"
            onClick={resendCode}
            loading={isResending}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default VerificationCodeDialog;
