import { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useToast } from '../contexts/ToastContext';
import { useIntl, FormattedMessage } from 'react-intl';
import { api } from '../services/api-client';

const ForgotPassword = () => {
  const intl = useIntl();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      await api.auth.forgotPassword({ email });
      showToast('success', 'Success', intl.formatMessage({ id: 'forgotPassword.success' }));
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-column align-items-center justify-content-center">
      <div className="forgot-password-container">
        <Card title={intl.formatMessage({ id: 'forgotPassword.title' })}>
          <div className="p-field">
            <label htmlFor="email">
              <FormattedMessage id="forgotPassword.email" />
            </label>
            <InputText id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex align-items-center justify-content-center gap-1 pt-4">
            <Button
              label={intl.formatMessage({ id: 'forgotPassword.sendLink' })}
              icon="pi pi-envelope"
              loading={loading}
              onClick={handleForgotPassword}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
