import React, { useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import '../styles/Header.css';

const Header = () => {
  const { user, coach, client, setUser } = useContext(UserContext);
  const op = useRef(null);
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/')
  };
  console.log(user, coach, client)
  if (!user) return null;
  else if(user && !user.isVerified) return null;
  else if(user && (!coach && !client)) return null;

  return (
    <header className="app-header p-d-flex p-jc-between p-ai-center p-shadow-2 p-p-3">
      <div className="logo">
        <Link to={user.userType === 'client' ? '/student' : '/coach'} className="p-text-bold p-text-uppercase p-mr-3">EaseTrain</Link>
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
          {user.userType === 'coach' ?(<Link to="/manage-students" className="p-d-block p-py-2">Clients</Link>) : <></>}
          {/* <Link to="/training-plans" className="p-d-block p-py-2">Training Plans</Link> */}
          {/* <Link to="/settings" className="p-d-block p-py-2">Settings</Link> */}
          <Button label="Logout" icon="pi pi-sign-out" className="p-button-danger p-d-block p-my-2" onClick={handleLogout} />
        </OverlayPanel>
      </div>
    </header>
  );
};

export default Header;