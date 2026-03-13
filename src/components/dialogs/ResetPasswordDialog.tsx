import React, { useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { useIntl, FormattedMessage } from 'react-intl';

export interface ResetPasswordDialogProps {
  visible: boolean;
  onHide: () => void;
  newPassword: string;
  confirmPassword: string;
  isResetting: boolean;
  errors: { newPassword?: string; confirmPassword?: string };
  onNewPasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmPasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResetPassword: () => Promise<boolean>;
  onReset: () => void;
}

const ResetPasswordDialog = ({
  visible,
  onHide,
  newPassword,
  confirmPassword,
  isResetting,
  errors,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onResetPassword,
  onReset
}: ResetPasswordDialogProps) => {
  const intl = useIntl();

  useEffect(() => {
    if (!visible) {
      onReset();
    }
  }, [visible, onReset]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onResetPassword();
    // El cierre del dialog lo maneja onSuccess en el padre via setResetPasswordVisible(false)
  };

  return (
    <Dialog
      header={intl.formatMessage({ id: 'resetPassword.title' })}
      visible={visible}
      onHide={onHide}
      draggable={false}
      dismissableMask
      resizable={false}
      className="border-round-2xl w-4/5 sm:w-11/12"
      style={{ width: 500 }}
      modal
    >
      <form onSubmit={handleSubmit} className="p-fluid p-4">
        <div className="field">
          <p className="mb-4 text-600">
            <FormattedMessage id="resetPassword.message" />
          </p>
          <label htmlFor="newPassword" className="block text-900 font-medium mb-2">
            <FormattedMessage id="resetPassword.newPassword" />
          </label>
          <Password
            id="newPassword"
            value={newPassword}
            onChange={onNewPasswordChange}
            toggleMask
            feedback={true}
            className={classNames('w-full p-inputtext-lg', { 'p-invalid': errors.newPassword })}
            placeholder={intl.formatMessage({ id: 'resetPassword.newPasswordPlaceholder' })}
          />
          {errors.newPassword && <small className="p-error">{errors.newPassword}</small>}
        </div>
        <div className="field mt-4">
          <label htmlFor="confirmNewPassword" className="block text-900 font-medium mb-2">
            <FormattedMessage id="resetPassword.confirmPassword" />
          </label>
          <Password
            id="confirmNewPassword"
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            toggleMask
            feedback={false}
            className={classNames('w-full p-inputtext-lg', {
              'p-invalid': errors.confirmPassword
            })}
            placeholder={intl.formatMessage({ id: 'resetPassword.confirmPasswordPlaceholder' })}
          />
          {errors.confirmPassword && <small className="p-error">{errors.confirmPassword}</small>}
        </div>
        <Button
          type="submit"
          label={intl.formatMessage({ id: 'resetPassword.button' })}
          className="p-button-lg w-full mt-4"
          loading={isResetting}
        />
      </form>
    </Dialog>
  );
};

export default ResetPasswordDialog;
