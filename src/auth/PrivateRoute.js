import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';

const PrivateRoute = ({ element: Component, requiredType, ...rest }) => {
  const { user, coach, client } = useContext(UserContext);
  console.log(user, coach, client)
  if (!user) {
    return <Navigate to="/" />;
  }

  if (requiredType && user.userType !== requiredType) {
    return <Navigate to="/unauthorized" />;
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