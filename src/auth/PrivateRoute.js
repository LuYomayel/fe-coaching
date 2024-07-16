import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';

const PrivateRoute = ({ element: Component, requiredType, ...rest }) => {
  const { user, coach, client } = useContext(UserContext);

  if (!user) {
    return <Navigate to="/" />;
  }

  if (requiredType && user.userType !== requiredType) {
    console.log('unauthorized', user.userType)
    return <Navigate to="/unauthorized" />;
  }else if(requiredType && requiredType === 'coach' && !coach){
    return <Navigate to="/complete-coach-profile" />;
  }

  return <Component {...rest} />;
};

export default PrivateRoute;