import { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import CoachProfileForm from '../pages/CoachProfileForm';
//import NotSubscribed from '../components/NotSubscribed';
//import { ESubscriptionStatus } from 'types/enums/subscription-status';

interface PrivateRouteProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: ComponentType<any>;
  requiredType?: 'coach' | 'client';
  [key: string]: unknown;
}

const PrivateRoute = ({ element: Component, requiredType, ...rest }: PrivateRouteProps) => {
  const { user, coach, isInitialized } = useUser();

  // Si el contexto no está inicializado, mostramos nada
  if (!isInitialized) {
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
  //if (user.userType === 'client' && client?.user?.subscription?.status === ESubscriptionStatus.INACTIVE) {
  //return <NotSubscribed />;
  //}

  // Si todo está bien, renderizamos el componente
  return <Component {...rest} />;
};

export default PrivateRoute;
