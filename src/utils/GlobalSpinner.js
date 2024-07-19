import React, { createContext, useContext, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

// Crear un contexto para el spinner
const SpinnerContext = createContext();

export const SpinnerProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <SpinnerContext.Provider value={{ loading, setLoading }}>
      {loading && (
        <div className="global-spinner">
          <ProgressSpinner />
        </div>
      )}
      {children}
    </SpinnerContext.Provider>
  );
};

export const useSpinner = () => useContext(SpinnerContext);