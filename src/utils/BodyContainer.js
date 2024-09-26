import React from 'react';
import { useLocation } from 'react-router-dom';

const BodyContainer = ({ children }) => {
  const location = useLocation();
  const shouldApplyBodyContainer = location.pathname !== '/' && location.pathname !== '/login';

  return <div className={shouldApplyBodyContainer ? 'body-container' : 'home-container'}>{children}</div>;
};

export default BodyContainer;