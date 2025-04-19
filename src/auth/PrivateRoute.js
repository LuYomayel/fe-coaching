import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import CoachProfileForm from '../pages/CoachProfileForm';
import NotSubscribed from '../components/NotSubscribed';
import { useSpinner } from '../utils/GlobalSpinner';

const PrivateRoute = ({ element: Component, requiredType, ...rest }) => {
  const { user, coach, client } = useContext(UserContext);
  const { isLoading } = useSpinner();

  if (isLoading) {
    return <></>;
  }

  if (!user) {
    return <Navigate to="/" />;
  } else if (requiredType && user.userType !== requiredType) {
    return <Navigate to="/unauthorized" />;
  } else if (user.userType === 'coach' && !coach && !isLoading) {
    return <CoachProfileForm />;
  }
  if (user.userType === 'client' && client?.user?.subscription?.status === 'Inactive') {
    return <NotSubscribed />;
  }

  return <Component {...rest} />;
};

export default PrivateRoute;
