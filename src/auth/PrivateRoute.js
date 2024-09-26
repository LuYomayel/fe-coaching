import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import CoachProfileForm from '../pages/CoachProfileForm';
import NotSubscribed from '../components/NotSubscribed';
import { useSpinner } from '../utils/GlobalSpinner';
import Spinner from '../utils/LittleSpinner';
const PrivateRoute = ({ element: Component, requiredType, ...rest }) => {
  const { user, coach, client, isLoading } = useContext(UserContext);
  const { loading } = useSpinner();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center align-items-center h-screen">
        <Spinner />
      </div>
    ); // O muestra un spinner o un componente de carga mientras se obtienen los datos
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  else if (requiredType && user.userType !== requiredType) {
    return <Navigate to="/unauthorized" />;
  }
  else if (user.userType === 'coach' && coach) {
    return <CoachProfileForm/>;
  }
  if (user.userType === 'client' && client && client.user.subscription.status === 'Inactive') {
    return <NotSubscribed />;
  }

  return <Component {...rest} />;
};

export default PrivateRoute;