import React, { useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useIntl, FormattedMessage } from 'react-intl';

export interface ForgotPasswordVerificationDialogProps {
  visible: boolean;
  onHide: () => void;
  email: string;
  code: string;
  codeSent: boolean;
  isSendingCode: boolean;
  isVerifying: boolean;
  isResending: boolean;
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCodeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSendCode: () => Promise<boolean>;
  onVerifyCode: () => Promise<boolean>;
  onResendCode: () => Promise<boolean>;
  onReset: () => void;
}

const ForgotPasswordVerificationDialog = ({
  visible,
  onHide,
  email,
  code,
  codeSent,
  isSendingCode,
  isVerifying,
  isResending,
  onEmailChange,
  onCodeChange,
  onSendCode,
  onVerifyCode,
  onResendCode,
  onReset
}: ForgotPasswordVerificationDialogProps) => {
  const intl = useIntl();

  useEffect(() => {
    if (!visible) {
      onReset();
    }
  }, [visible, onReset]);

  const handleSendCode = async () => {
    await onSendCode();
  };

  const handleVerification = async () => {
    const success = await onVerifyCode();
    if (success) {
      onHide();
    }
  };

  return (
    <Dialog
      header={intl.formatMessage({ id: 'forgotPassword.title' })}
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
        {!codeSent ? (
          <>
            <div className="field">
              <p className="mb-3 text-600">
                <FormattedMessage id="forgotPassword.message" />
              </p>
              <label htmlFor="forgotPasswordEmail" className="block text-900 font-medium mb-2">
                <FormattedMessage id="forgotPassword.email" />
              </label>
              <InputText
                id="forgotPasswordEmail"
                type="email"
                value={email}
                onChange={onEmailChange}
                className="w-full p-inputtext-lg"
                placeholder={intl.formatMessage({ id: 'forgotPassword.emailPlaceholder' })}
              />
            </div>
            <Button
              label={intl.formatMessage({ id: 'forgotPassword.sendCode' })}
              className="p-button-lg w-full mt-3"
              onClick={handleSendCode}
              loading={isSendingCode}
            />
          </>
        ) : (
          <>
            <div className="field">
              <p className="mb-3">
                <FormattedMessage
                  id="forgotPassword.codeMessage"
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
                onChange={onCodeChange}
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
                onClick={onResendCode}
                loading={isResending}
              />
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};

export default ForgotPasswordVerificationDialog;
