import React, { createContext, useContext, useState } from 'react';
import LogoLoader from '../components/LogoLoader';

// Crear un contexto para el spinner
const SpinnerContext = createContext();

export const SpinnerProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);

  return (
    <SpinnerContext.Provider value={{ loading, setLoading }}>
      {loading && (
        <div className="global-spinner-container">
          <LogoLoader size="large" className="global-spinner" />
        </div>
      )}
      {children}
    </SpinnerContext.Provider>
  );
};

export const useSpinner = () => useContext(SpinnerContext);
