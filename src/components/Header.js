import React, { useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import '../styles/Header.css';

const Header = () => {
  const { user, setUser } = useContext(UserContext);
  const op = useRef(null);
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/')
  };

  if (!user) return null;

  return (
    <header className="app-header p-d-flex p-jc-between p-ai-center p-shadow-2 p-p-3">
      <div className="logo">
        <Link to="/" className="p-text-bold p-text-uppercase p-mr-3">MyFitnessApp</Link>
      </div>
      <div className="p-d-flex p-ai-center user-info">
        <span className="p-mr-2">{user.name}</span>
        <img
          src={user.profilePicture || '/default-profile.png'}
          alt="Profile"
          className="profile-picture"
          onClick={(e) => op.current.toggle(e)}
        />
        <OverlayPanel ref={op} className="user-menu">
          <Link to="/home" className="p-d-block p-py-2">Home</Link>
          <Link to="/profile" className="p-d-block p-py-2">Profile</Link>
          <Link to="/training-plans" className="p-d-block p-py-2">Training Plans</Link>
          <Link to="/settings" className="p-d-block p-py-2">Settings</Link>
          <Button label="Logout" icon="pi pi-sign-out" className="p-button-danger p-d-block p-my-2" onClick={handleLogout} />
        </OverlayPanel>
      </div>
    </header>
  );
};

export default Header;