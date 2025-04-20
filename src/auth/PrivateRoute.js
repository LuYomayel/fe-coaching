import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import CoachProfileForm from '../pages/CoachProfileForm';
import NotSubscribed from '../components/NotSubscribed';
import { useSpinner } from '../utils/GlobalSpinner';

const PrivateRoute = ({ element: Component, requiredType, ...rest }) => {
  const { user, coach, client, isInitialized } = useContext(UserContext);
  const { isLoading } = useSpinner();

  // Si el contexto no está inicializado o está cargando, mostramos nada
  if (!isInitialized || isLoading) {
    return null;
  }

  // Si no hay usuario, redirigimos al login
  if (!user) {
    return <Navigate to="/" />;
  }

  // Si el tipo de usuario no coincide con el requerido
  if (requiredType && user.userType !== requiredType) {
    return <Navigate to="/unauthorized" />;
  }

  // Si es coach y no tiene perfil completo
  if (user.userType === 'coach' && !coach) {
    return <CoachProfileForm />;
  }

  // Si es cliente y no está suscrito
  if (user.userType === 'client' && client?.user?.subscription?.status === 'Inactive') {
    return <NotSubscribed />;
  }

  // Si todo está bien, renderizamos el componente
  return <Component {...rest} />;
};

export default PrivateRoute;
