import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useIntl } from 'react-intl';
import { Button } from 'primereact/button';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ onExpandChange }: { onExpandChange: (expanded: boolean) => void }) => {
  const intl = useIntl();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expanded, setExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notificar al componente padre cuando cambia el estado de expansión
  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(expanded);
    }
  }, [expanded, onExpandChange]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      setIsInitialized(true);
    } else {
      setIsInitialized(false);
    }
  }, [user]);

  const menuItems = [
    {
      label: intl.formatMessage({ id: 'header.home' }),
      icon: 'pi pi-home',
      command: () => navigate(user?.userType === 'client' ? '/student' : '/coach')
    },
    {
      label: intl.formatMessage({ id: 'header.profile' }),
      icon: 'pi pi-user',
      command: () => navigate(user?.userType === 'client' ? '/student/profile' : '/coach/profile')
    },
    {
      label: intl.formatMessage({ id: 'header.clients' }),
      icon: 'pi pi-users',
      command: () => {
        if (user?.userType === 'coach') navigate('/manage-students');
      },
      visible: user?.userType === 'coach'
    },
    {
      label: intl.formatMessage({ id: 'header.plans' }),
      icon: 'pi pi-calendar',
      command: () => navigate('/coach/plans'),
      visible: user?.userType === 'coach'
    },
    /*
    {
      label: intl.formatMessage({ id: 'header.settings' }),
      icon: 'pi pi-cog',
      command: () => navigate('/settings')
    },
    */
    {
      label: intl.formatMessage({ id: 'header.logout' }),
      icon: 'pi pi-power-off',
      command: () => handleLogout()
    }
  ];

  if (!isInitialized) {
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
            <Avatar image={user?.profileImage || '/image.webp'} shape="circle" size="xlarge" className="mb-3" />
            <h3 className="m-0">{user?.name}</h3>
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
          <Avatar image={user?.profileImage || '/image.webp'} shape="circle" size="xlarge" className="mb-3" />
          {expanded && <h3 className="m-0">{user?.name}</h3>}
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
