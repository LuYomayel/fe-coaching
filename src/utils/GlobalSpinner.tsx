import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import LogoLoader from '../components/LogoLoader';

interface ISpinnerContextValue {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const SpinnerContext = createContext<ISpinnerContextValue | undefined>(undefined);

export const SpinnerProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);

  const contextValue = useMemo(() => ({ loading, setLoading }), [loading]);

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

export const useSpinner = (): ISpinnerContextValue => {
  const context = useContext(SpinnerContext);
  if (!context) {
    throw new Error('useSpinner must be used within a SpinnerProvider');
  }
  return context;
};
