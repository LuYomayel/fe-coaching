import { Button } from 'primereact/button';
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { useIntl, FormattedMessage } from 'react-intl';

const Unauthorized = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { setUser, setClient, setCoach } = useContext(UserContext);
  const handleClick = () => {
    localStorage.removeItem('token');
    setCoach(null);
    setClient(null);
    setUser(null);
    navigate('/');
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
