import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { useIntl } from 'react-intl';
import { Button } from 'primereact/button';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import { Avatar } from 'primereact/avatar';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ onExpandChange }: { onExpandChange: (expanded: boolean) => void }) => {
  const intl = useIntl();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expanded, setExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    setIsInitialized(!!user);
  }, [user]);

  const menuItems = [
    {
      label: intl.formatMessage({ id: 'header.home' }),
      icon: 'pi pi-home',
      path: user?.userType === 'client' ? '/student' : '/coach',
      command: () => navigate(user?.userType === 'client' ? '/student' : '/coach')
    },
    {
      label: intl.formatMessage({ id: 'header.profile' }),
      icon: 'pi pi-user',
      path: user?.userType === 'client' ? '/student/profile' : '/coach/profile',
      command: () => navigate(user?.userType === 'client' ? '/student/profile' : '/coach/profile')
    },
    {
      label: intl.formatMessage({ id: 'header.clients' }),
      icon: 'pi pi-users',
      path: '/manage-students',
      command: () => navigate('/manage-students'),
      visible: user?.userType === 'coach'
    },
    {
      label: intl.formatMessage({ id: 'header.plans' }),
      icon: 'pi pi-calendar',
      path: '/coach/plans',
      command: () => navigate('/coach/plans'),
      visible: user?.userType === 'coach'
    },
    {
      label: intl.formatMessage({ id: 'header.logout' }),
      icon: 'pi pi-sign-out',
      path: '',
      command: () => handleLogout(),
      isLogout: true
    }
  ];

  const isActive = useCallback(
    (path: string) => {
      if (!path) return false;
      return location.pathname === path || location.pathname.startsWith(path + '/');
    },
    [location.pathname]
  );

  if (!isInitialized) {
    return null;
  }

  // Mobile: slide-in sidebar with glass effect
  if (isMobile) {
    return (
      <>
        <Button
          icon="pi pi-bars"
          onClick={() => setVisible(true)}
          className="p-button-text p-button-rounded"
          style={{
            position: 'fixed',
            top: '0.75rem',
            left: '0.75rem',
            zIndex: 1000,
            width: '2.5rem',
            height: '2.5rem',
            background: 'var(--ios-glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: '1px solid var(--ios-glass-border)'
          }}
        />
        <PrimeSidebar
          visible={visible}
          onHide={() => setVisible(false)}
          showCloseIcon={true}
          style={{
            width: '280px',
            background: 'var(--ios-glass-bg)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)'
          }}
        >
          <div className="flex flex-column h-full">
            {/* User section */}
            <div className="flex flex-column align-items-center py-4 px-3">
              <Avatar
                image={user?.profileImage || '/image.webp'}
                shape="circle"
                size="xlarge"
                style={{
                  width: '72px',
                  height: '72px',
                  border: '3px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                }}
              />
              <h3
                style={{
                  margin: '0.75rem 0 0.25rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  letterSpacing: '-0.02em'
                }}
              >
                {user?.name}
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#8e8e93', fontWeight: 500 }}>
                {user?.userType === 'coach' ? 'Coach' : 'Athlete'}
              </span>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'var(--ios-divider)', margin: '0 1rem' }} />

            {/* Menu items */}
            <div className="flex flex-column gap-1 py-3 px-3 flex-grow-1">
              {menuItems.map((item, index) => {
                if (item.visible === false) return null;
                const active = isActive(item.path);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.command();
                      setVisible(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      color: (item as { isLogout?: boolean }).isLogout
                        ? '#ef4444'
                        : active
                          ? '#6366f1'
                          : 'var(--ios-text)',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      fontWeight: active ? 600 : 500,
                      width: '100%',
                      textAlign: 'left'
                    }}
                  >
                    <i
                      className={item.icon}
                      style={{
                        fontSize: '1.1rem',
                        width: '1.5rem',
                        textAlign: 'center'
                      }}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </PrimeSidebar>
      </>
    );
  }

  // Desktop: fixed sidebar with glass effect
  return (
    <div
      className="sidebar-container"
      style={{
        width: expanded ? '240px' : '68px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 100
      }}
    >
      <div
        className="flex flex-column h-full"
        style={{
          background: 'var(--ios-glass-bg)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRight: '1px solid var(--ios-glass-border)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.03)'
        }}
      >
        {/* Header / Toggle */}
        <div
          className="flex align-items-center justify-content-center"
          style={{
            padding: expanded ? '1rem 1rem' : '1rem 0',
            minHeight: '56px'
          }}
        >
          {expanded ? (
            <div className="flex align-items-center justify-content-between w-full px-2">
              <div className="flex align-items-center gap-2">
                <img src="/logo512.png" alt="EaseTrain" style={{ height: '28px', borderRadius: '8px' }} />
                <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--ios-text)' }}>
                  EaseTrain
                </span>
              </div>
              <Button
                icon="pi pi-chevron-left"
                className="p-button-text p-button-rounded p-button-sm"
                onClick={() => setExpanded(false)}
                style={{ width: '2rem', height: '2rem', color: '#8e8e93' }}
              />
            </div>
          ) : (
            <Button
              icon="pi pi-bars"
              className="p-button-text p-button-rounded p-button-sm"
              onClick={() => setExpanded(true)}
              style={{ width: '2.2rem', height: '2.2rem', color: '#636366' }}
            />
          )}
        </div>

        {/* Avatar section */}
        <div
          className="flex flex-column align-items-center"
          style={{ padding: expanded ? '0.75rem 1rem' : '0.75rem 0' }}
        >
          <Avatar
            image={user?.profileImage || '/image.webp'}
            shape="circle"
            size={expanded ? 'xlarge' : 'large'}
            style={{
              border: '2px solid rgba(99, 102, 241, 0.15)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
          {expanded && (
            <div className="text-center mt-2" style={{ animation: 'fadeInUp 0.2s ease-out' }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                {user?.name}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--ios-text-secondary)', fontWeight: 500 }}>
                {user?.userType === 'coach' ? 'Coach' : 'Athlete'}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: 'var(--ios-divider)',
            margin: expanded ? '0.5rem 1rem' : '0.5rem 0.75rem'
          }}
        />

        {/* Navigation items */}
        <div className="flex flex-column gap-1" style={{ padding: expanded ? '0.5rem 0.75rem' : '0.5rem 0.6rem' }}>
          {menuItems.map((item, index) => {
            if (item.visible === false) return null;
            const active = isActive(item.path);
            const isLogout = (item as { isLogout?: boolean }).isLogout;

            return (
              <button
                key={index}
                onClick={item.command}
                title={!expanded ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.7rem',
                  padding: expanded ? '0.6rem 0.75rem' : '0.6rem 0',
                  justifyContent: expanded ? 'flex-start' : 'center',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: active ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: isLogout ? '#ef4444' : active ? '#6366f1' : 'var(--ios-text-secondary)',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                  fontWeight: active ? 600 : 500,
                  width: '100%',
                  textAlign: 'left',
                  letterSpacing: '-0.01em'
                }}
              >
                <i
                  className={item.icon}
                  style={{
                    fontSize: '1.05rem',
                    width: '1.5rem',
                    textAlign: 'center',
                    flexShrink: 0
                  }}
                />
                {expanded && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
