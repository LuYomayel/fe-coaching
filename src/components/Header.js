import React, { useState, useRef, useContext } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Menu } from 'primereact/menu';
import { UserContext } from '../utils/UserContext';
import { useNavigate, Link } from 'react-router-dom';
import ChatSidebar from './ChatSideBar';
import { useChatSidebar } from '../utils/ChatSideBarContext';

export default function Header() {
  const [visible, setVisible] = useState(false);
  const { isChatSidebarOpen, closeChatSidebar, openChatSidebar } = useChatSidebar();
  const op = useRef(null);
  const { user, coach, client, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const menuItems = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      command: () => navigate(user.userType === 'client' ? '/student' : '/coach'),
    },
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => navigate(user.userType === 'client' ? '/student/profile' : '/coach/profile'),
    },
    {
      label: 'Clients',
      icon: 'pi pi-users',
      command: () => {
        if (user.userType === 'coach') navigate('/manage-students');
      },
      visible: user?.userType === 'coach',  // Sólo visible para coach
    },
    {
      label: 'Logout',
      icon: 'pi pi-power-off',
      command: () => handleLogout(),
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  if (!user || (user && !user.isVerified) || (user && (!coach && !client)) || (user && client && client.user.subscription.status === 'Inactive')) {
    return null;
  }

  return (
    <div className="flex justify-content-between align-items-center p-3 surface-0 shadow-1">
      <div className="flex align-items-center">
        <Link to={user.userType === 'client' ? '/student' : '/coach'}>
          <img src="/logo512.png" alt="EaseTrain Logo" className="mr-2" style={{ height: '40px' }} />
        </Link>
        <span className="text-xl font-bold">EaseTrain</span>
      </div>
      <div className="flex align-items-center">
        <Button icon="pi pi-comments" onClick={openChatSidebar} className="p-button-text mr-2" label="Chat" />
        <Avatar image={user.profilePicture || '/image.webp'} shape="circle" onClick={(e) => op.current.toggle(e)} />
        <OverlayPanel ref={op}>
          <Menu model={menuItems} />
        </OverlayPanel>
      </div>
      <Sidebar visible={isChatSidebarOpen} position="right" onHide={() => closeChatSidebar()} style={{ width: '40rem' }}>
        <ChatSidebar isCoach={user.userType === 'coach'} />
      </Sidebar>
    </div>
  );
}