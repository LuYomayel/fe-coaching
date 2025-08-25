import { Button } from 'primereact/button';
import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '../utils/UserContext';
import { authService } from '../services/authService';
import { useIntl, FormattedMessage } from 'react-intl';
import { UserContextType } from '../types/shared-types';

const Unauthorized = () => {
  const intl = useIntl();
  const router = useRouter();
  const userContext = useContext(UserContext) as UserContextType;
  if (!userContext) {
    throw new Error('Unauthorized must be used within a UserProvider');
  }
  const { setUser, setClient, setCoach } = userContext;
  const handleClick = () => {
    authService.removeToken();
    setCoach(null);
    setClient(null);
    setUser(null);
    router.push('/');
  };

  return (
    <div className="flex justify-content-center align-items-center flex-column" style={{ height: '80vh' }}>
      <h1>
        <FormattedMessage id="unauthorized.title" />
      </h1>
      <p>
        <FormattedMessage id="unauthorized.message" />
      </p>
      <Button
        className="p-button p-button-rounded p-button-primary"
        text
        outlined
        onClick={handleClick}
        label={intl.formatMessage({ id: 'unauthorized.button' })}
      />
    </div>
  );
};

export default Unauthorized;
