import { ChangeEventHandler, FormEvent } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { classNames } from 'primereact/utils';
import { FormattedMessage, useIntl } from 'react-intl';

export interface SignUpDialogProps {
  visible: boolean;
  onHide: () => void;
  formValues: { email: string; password: string; confirmPassword: string };
  formErrors: Partial<{ email: string; password: string; confirmPassword: string }> & { [key: string]: string };
  onFieldChange: (field: 'email' | 'password' | 'confirmPassword') => ChangeEventHandler<HTMLInputElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  onSwitchToLogin: () => void;
}
export const SignUpDialog = ({
  visible,
  onHide,
  formValues,
  formErrors,
  onFieldChange,
  onSubmit,
  loading,
  onSwitchToLogin
}: SignUpDialogProps) => {
  const intl = useIntl();

  return (
    <Dialog
      header={intl.formatMessage({ id: 'home.signup.title' })}
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
          <label htmlFor="signUpEmail" className="block text-900 font-medium mb-2">
            <FormattedMessage id="home.signup.email" />
          </label>
          <InputText
            id="signUpEmail"
            type="email"
            value={formValues.email}
            onChange={onFieldChange('email')}
            className={classNames('w-full p-inputtext-lg', { 'p-invalid': formErrors.email })}
            placeholder={intl.formatMessage({ id: 'home.signup.emailPlaceholder' })}
          />
          {formErrors.email && <small className="p-error">{formErrors.email}</small>}
        </div>
        <div className="field mt-4">
          <label htmlFor="signUpPassword" className="block text-900 font-medium mb-2">
            <FormattedMessage id="home.signup.password" />
          </label>
          <Password
            id="signUpPassword"
            value={formValues.password}
            onChange={onFieldChange('password')}
            toggleMask
            feedback={false}
            className={classNames('w-full p-inputtext-lg', { 'p-invalid': formErrors.password })}
            placeholder={intl.formatMessage({ id: 'home.signup.passwordPlaceholder' })}
          />
          {formErrors.password && <small className="p-error">{formErrors.password}</small>}
        </div>
        <div className="field mt-4">
          <label htmlFor="confirmPassword" className="block text-900 font-medium mb-2">
            <FormattedMessage id="home.signup.confirmPassword" />
          </label>
          <Password
            id="confirmPassword"
            value={formValues.confirmPassword}
            onChange={onFieldChange('confirmPassword')}
            toggleMask
            className={classNames('w-full p-inputtext-lg', {
              'p-invalid': formErrors.confirmPassword
            })}
            feedback={false}
            placeholder={intl.formatMessage({ id: 'home.signup.confirmPasswordPlaceholder' })}
          />
          {formErrors.confirmPassword && <small className="p-error">{formErrors.confirmPassword}</small>}
        </div>
        <Button
          type="submit"
          label={intl.formatMessage({ id: 'home.signup.title' })}
          className="p-button-lg w-full mt-4"
          loading={loading}
        />
        <div className="text-center mt-3">
          <span className="text-600">
            <FormattedMessage id="home.signup.haveAccount" />
          </span>
          <Button
            label={intl.formatMessage({ id: 'home.signup.login' })}
            className="p-button-text p-button-sm text-primary font-medium ml-1"
            onClick={(event) => {
              event.preventDefault();
              if (onSwitchToLogin) {
                onSwitchToLogin();
              }
            }}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default SignUpDialog;
