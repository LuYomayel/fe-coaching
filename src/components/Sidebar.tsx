'use client';
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { UserContext } from '../utils/UserContext';
import { authService } from '../services/authService';
import { useIntl } from 'react-intl';
import { Button } from 'primereact/button';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  onExpandChange?: (expanded: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onExpandChange }) => {
  const intl = useIntl();
  const userContext = useContext(UserContext);
  if (!userContext) {
    throw new Error('Sidebar must be used within a UserProvider');
  }
  const { user, client, setUser } = userContext;

  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [expanded, setExpanded] = useState(false);

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Llamar inmediatamente para establecer el estado inicial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notificar al componente padre cuando cambia el estado de expansión
  const handleExpandChange = useCallback(
    (expanded: boolean) => {
      if (onExpandChange) {
        onExpandChange(expanded);
      }
    },
    [onExpandChange]
  );

  useEffect(() => {
    handleExpandChange(expanded);
  }, [expanded, handleExpandChange]);

  const handleLogout = useCallback(() => {
    authService.removeToken();
    setUser(null);
    router.push('/');
  }, [setUser, router]);

  const menuItems = [
    {
      label: intl.formatMessage({ id: 'header.home' }),
      icon: 'pi pi-home',
      command: () => router.push(user?.userType === 'client' ? '/student' : '/coach')
    },
    {
      label: intl.formatMessage({ id: 'header.profile' }),
      icon: 'pi pi-user',
      command: () => router.push(user?.userType === 'client' ? '/student/profile' : '/coach/profile')
    },
    {
      label: intl.formatMessage({ id: 'header.clients' }),
      icon: 'pi pi-users',
      command: () => {
        if (user?.userType === 'coach') router.push('/manage-students');
      },
      visible: user?.userType === 'coach'
    },
    {
      label: intl.formatMessage({ id: 'header.plans' }),
      icon: 'pi pi-calendar',
      command: () => router.push('/coach/plans'),
      visible: user?.userType === 'coach'
    },
    {
      label: intl.formatMessage({ id: 'header.settings' }),
      icon: 'pi pi-cog',
      command: () => router.push('/settings')
    },
    {
      label: intl.formatMessage({ id: 'header.logout' }),
      icon: 'pi pi-power-off',
      command: handleLogout
    }
  ];

  // Si no hay usuario o no está verificado, no mostrar el sidebar
  if (!user || !user.isVerified) {
    return null;
  }

  // Si es cliente y no está suscrito, no mostrar el sidebar
  if (user.userType === 'client' && (!client || !client.user || client.user.subscription?.status === 'Inactive')) {
    return null;
  }

  // Versión móvil: Botón de menú y sidebar desplegable
  if (isMobile) {
    return (
      <>
        <Button
          icon="pi pi-bars"
          onClick={() => setVisible(true)}
          className="p-button-text p-button-rounded"
          style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 1000 }}
        />
        <PrimeSidebar visible={visible} onHide={() => setVisible(false)} className="p-sidebar-lg" showCloseIcon={true}>
          <div className="flex flex-column align-items-center mb-4">
            <Avatar image={'/image.webp'} shape="circle" size="xlarge" className="mb-3" />
            <h3 className="m-0">{user.name}</h3>
          </div>
          <Menu model={menuItems} className="w-full" />
        </PrimeSidebar>
      </>
    );
  }

  // Versión desktop: Sidebar fijo con iconos y tooltips
  return (
    <div
      className="sidebar-container"
      style={{
        width: expanded ? '250px' : '70px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: 'width 0.3s ease'
      }}
    >
      <div className="flex flex-column h-full surface-0 shadow-2">
        <div className="flex align-items-center justify-content-between p-4 border-bottom-1 surface-border">
          {expanded ? (
            <>
              <img src="/logo512.png" alt="EaseTrain Logo" style={{ height: '40px' }} />
              <Button
                icon="pi pi-times"
                className="p-button-text p-button-rounded"
                onClick={() => setExpanded(false)}
              />
            </>
          ) : (
            <Button icon="pi pi-bars" className="p-button-text p-button-rounded" onClick={() => setExpanded(true)} />
          )}
        </div>
        <div className="flex flex-column align-items-center p-4 border-bottom-1 surface-border">
          <Avatar image={'/image.webp'} shape="circle" size="xlarge" className="mb-3" />
          {expanded && <h3 className="m-0">{user.name}</h3>}
        </div>
        <div className="flex flex-column py-4">
          {menuItems.map((item, index) => {
            if (item.visible === false) return null;
            return (
              <div key={index} className="mb-3 px-3">
                {expanded ? (
                  <Button
                    icon={item.icon}
                    label={item.label}
                    className="p-button-text w-full justify-content-start"
                    onClick={item.command}
                  />
                ) : (
                  <Button
                    icon={item.icon}
                    className="p-button-text p-button-rounded"
                    onClick={item.command}
                    tooltip={item.label}
                    tooltipOptions={{ position: 'right' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
