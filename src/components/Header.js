import React, { useContext, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import ChatSidebar from './ChatSideBar';

import '../styles/Header.css';

const Header = () => {
  const { user, coach, client, setUser } = useContext(UserContext);
  const op = useRef(null);
  const [chatVisible, setChatVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  if (!user) return null;
  else if (user && !user.isVerified) return null;
  else if (user && (!coach && !client)) return null;
  else if (user && client && client.user.subscription.status === 'Inactive') return null;

  return (
    <header className="app-header p-d-flex p-jc-between p-ai-center p-shadow-2 p-p-3">
      <Button icon="pi pi-comments" onClick={() => setChatVisible(true)} className="p-mr-2" label="Chat" />
      <Sidebar visible={chatVisible} onHide={() => setChatVisible(false)} position="left"style={{ width: '40rem' }} >
        <ChatSidebar />
      </Sidebar>
      <div className="logo">
        <Link to={user.userType === 'client' ? '/student' : '/coach'} className="p-text-bold p-text-uppercase p-mr-3">
          EaseTrain
        </Link>
      </div>
      <div className="p-d-flex p-ai-center user-info">
        <span className="p-mr-2">{user.name}</span>
        <img
          src={user.profilePicture || '/image.webp'}
          alt="Profile"
          className="profile-picture"
          onClick={(e) => op.current.toggle(e)}
        />
        <OverlayPanel ref={op} className="user-menu">
          <Link to={user.userType === 'client' ? '/student' : '/coach'} className="p-d-block p-py-2">Home</Link>
          <Link to={user.userType === 'client' ? '/student/profile' : '/coach/profile'} className="p-d-block p-py-2">Profile</Link>
          {user.userType === 'coach' && (
            <Link to="/manage-students" className="p-d-block p-py-2">Clients</Link>
          )}
          <Button label="Logout" icon="pi pi-sign-out" className="p-button-danger p-d-block p-my-2" onClick={handleLogout} />
        </OverlayPanel>
      </div>
    </header>
  );
};

export default Header;