import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { useSpinner } from '../utils/GlobalSpinner';

const PrivateRoute = ({ element: Component, requiredType, ...rest }) => {
  const { user, coach, client } = useContext(UserContext);
  const { loading } = useSpinner();

  if (!user) {
    return <Navigate to="/" />;
  }

  if (requiredType && user.userType !== requiredType) {
    return <Navigate to="/unauthorized" />;
  }

  if (loading) {
    return <ProgressSpinner />
  }

  if (user.userType === 'coach' && !coach) {
    return <Navigate to="/complete-coach-profile" />;
  }

  if (user.userType === 'client' && !client) {
    return <Navigate to="/" />;
  }

  return <Component {...rest} />;
};

export default PrivateRoute;