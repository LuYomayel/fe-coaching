import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { FormattedMessage, useIntl } from 'react-intl';
import { ChangeEventHandler, FormEvent } from 'react';

export interface LoginDialogProps {
  visible: boolean;
  onHide: () => void;
  formValues: { email: string; password: string };
  formErrors: Partial<{ email: string; password: string }> & { [key: string]: string };

  onFieldChange: (field: 'email' | 'password') => ChangeEventHandler<HTMLInputElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  onSwitchToSignUp: () => void;
  onForgotPassword?: () => void;
}
export const LoginDialog = ({
  visible,
  onHide,
  formValues,
  formErrors,
  onFieldChange,
  onSubmit,
  loading,
  onSwitchToSignUp,
  onForgotPassword
}: LoginDialogProps) => {
  const intl = useIntl();

  return (
    <Dialog
      header={intl.formatMessage({ id: 'home.login.title' })}
      visible={visible}
      draggable={false}
      dismissableMask
      resizable={false}
      className="border-round-2xl w-4/5 sm:w-11/12"
      style={{ width: 500 }}
      modal
      onHide={onHide}
    >
      <form onSubmit={onSubmit} className="p-fluid p-4">
        <div className="field">
          <label htmlFor="loginEmail" className="block text-900 font-medium mb-2">
            <FormattedMessage id="home.login.email" />
          </label>
          <InputText
            id="loginEmail"
            type="email"
            value={formValues.email}
            onChange={onFieldChange('email')}
            className={classNames('w-full p-inputtext-lg', { 'p-invalid': formErrors.email })}
            placeholder={intl.formatMessage({ id: 'home.login.emailPlaceholder' })}
          />
          {formErrors.email && <small className="p-error">{formErrors.email}</small>}
        </div>
        <div className="field mt-4">
          <label htmlFor="loginPassword" className="block text-900 font-medium mb-2">
            <FormattedMessage id="home.login.password" />
          </label>
          <Password
            id="loginPassword"
            value={formValues.password}
            onChange={onFieldChange('password')}
            toggleMask
            className={classNames('w-full p-inputtext-lg', { 'p-invalid': formErrors.password })}
            feedback={false}
            placeholder={intl.formatMessage({ id: 'home.login.passwordPlaceholder' })}
          />
          {formErrors.password && <small className="p-error">{formErrors.password}</small>}
        </div>
        <Button
          type="submit"
          label={intl.formatMessage({ id: 'home.header.login' })}
          className="p-button-lg w-full mt-4"
          loading={loading}
        />
        <div className="text-center mt-4">
          <Button
            label={intl.formatMessage({ id: 'home.login.forgotPassword' })}
            className="p-button-text p-button-sm text-primary font-medium"
            onClick={(event) => {
              event.preventDefault();
              if (onForgotPassword) {
                onForgotPassword();
              }
            }}
          />
        </div>
        <div className="text-center mt-3">
          <span className="text-600">
            <FormattedMessage id="home.login.noAccount" />
          </span>
          <Button
            label={intl.formatMessage({ id: 'home.login.signUp' })}
            className="p-button-text p-button-sm text-primary font-medium ml-1"
            onClick={(event) => {
              event.preventDefault();
              if (onSwitchToSignUp) {
                onSwitchToSignUp();
              }
            }}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default LoginDialog;
