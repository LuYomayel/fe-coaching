import React, { useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '../utils/UserContext';
import CoachProfileForm from '../pages/CoachProfileForm';
import NotSubscribed from '../components/NotSubscribed';
import { useSpinner } from '../utils/GlobalSpinner';

const PrivateRoute = ({ element: Component, requiredType, ...rest }) => {
  const { user, coach, client, isInitialized } = useContext(UserContext);
  const { loading } = useSpinner();
  const router = useRouter();

  useEffect(() => {
    // Si el contexto no está inicializado o está cargando, no hacemos nada
    if (!isInitialized || loading) {
      return;
    }

    // Si no hay usuario, redirigimos al login
    if (!user) {
      router.push('/');
      return;
    }

    // Si el tipo de usuario no coincide con el requerido
    if (requiredType && user.userType !== requiredType) {
      router.push('/unauthorized');
      return;
    }
  }, [user, requiredType, isInitialized, loading, router]);

  // Si el contexto no está inicializado o está cargando, mostramos nada
  if (!isInitialized || loading) {
    return null;
  }

  // Si no hay usuario, mostramos nada (ya se redirigió)
  if (!user) {
    return null;
  }

  // Si el tipo de usuario no coincide con el requerido, mostramos nada (ya se redirigió)
  if (requiredType && user.userType !== requiredType) {
    return null;
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
