import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="p-d-flex p-jc-center p-ai-center p-flex-column" style={{ height: '100vh' }}>
      <h1>Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
      <Link to="/">Go to Login</Link>
    </div>
  );
};

export default Unauthorized;