import { Button } from 'primereact/button';
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../utils/UserContext';

const NotSubscribed = () => {
  const navigate = useNavigate();
  const { setUser, setClient, setCoach } = useContext(UserContext)
  const handleClick = () => {
    localStorage.removeItem('token')
    setCoach(null)
    setClient(null)
    setUser(null)
    navigate('/')
  }

  return (
    <div className="flex justify-content-center align-items-center flex-column" style={{ height: '80vh' }}>
      <h1>No active subscription</h1>
      <p>You don't have any subscription available. Talk to your coach to fix this.</p>
      <Button className='p-button p-button-rounded p-button-primary' text outlined onClick={handleClick} label='Go to Login'/>
    </div>
  );
};

export default NotSubscribed;