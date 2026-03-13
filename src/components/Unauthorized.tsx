import { Button } from 'primereact/button';
import { useUser } from 'contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useIntl, FormattedMessage } from 'react-intl';

const Unauthorized = () => {
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
