import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import { useIntl, FormattedMessage } from 'react-intl';
import { useUser } from 'contexts/UserContext';

const NotSubscribed = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { logout } = useUser();
  const handleClick = () => {
    logout();
    navigate('/');
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
