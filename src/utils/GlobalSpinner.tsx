'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import LogoLoader from '../components/LogoLoader';

interface SpinnerContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

interface SpinnerProviderProps {
  children: ReactNode;
}

// Crear un contexto para el spinner
const SpinnerContext = createContext<SpinnerContextType | undefined>(undefined);

export const SpinnerProvider: React.FC<SpinnerProviderProps> = ({ children }) => {
  const [loading, setLoadingState] = useState<boolean>(false);

  // Memoizar setLoading para evitar que se recree en cada render
  const setLoading = useCallback((loading: boolean) => {
    // Evita trazas repetidas y renders inútiles
    setLoadingState((prev) => {
      if (prev === loading) return prev; // mismo valor → no cambia estado
      return loading;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('GlobalSpinner: setLoading →', loading);
      console.trace();
    }
  }, []);

  // Memoizar el contexto value
  const contextValue = useMemo(
    () => ({
      loading,
      setLoading
    }),
    [loading, setLoading]
  );

  return (
    <SpinnerContext.Provider value={contextValue}>
      {loading && (
        <div className="global-spinner-container">
          <LogoLoader size="large" className="global-spinner" />
        </div>
      )}
      {children}
    </SpinnerContext.Provider>
  );
};

export const useSpinner = (): SpinnerContextType => {
  const context = useContext(SpinnerContext);
  if (!context) {
    throw new Error('useSpinner must be used within a SpinnerProvider');
  }
  return context;
};
