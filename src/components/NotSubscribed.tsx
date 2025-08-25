import { Button } from 'primereact/button';
import React, { useContext } from 'react';
import { UserContext } from '../utils/UserContext';
import { authService } from '../services/authService';
import { useIntl, FormattedMessage } from 'react-intl';
import { useRouter } from 'next/navigation';

const NotSubscribed = () => {
  const intl = useIntl();
  const router = useRouter();
  const { setUser, setClient, setCoach } = useContext(UserContext) as UserContextType;
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
        <FormattedMessage id="notSubscribed.title" />
      </h1>
      <p>
        <FormattedMessage id="notSubscribed.message" />
      </p>
      <Button
        className="p-button p-button-rounded p-button-primary"
        text
        outlined
        onClick={handleClick}
        label={intl.formatMessage({ id: 'notSubscribed.button' })}
      />
    </div>
  );
};

export default NotSubscribed;
