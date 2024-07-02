import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';

const PrivateRoute = ({ element: Component, requiredType, ...rest }) => {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Navigate to="/" />;
  }

  if (requiredType && user.userType !== requiredType) {
    console.log('unauthorized', user.userType)
    return <Navigate to="/unauthorized" />;
  }

  return <Component {...rest} />;
};

export default PrivateRoute;