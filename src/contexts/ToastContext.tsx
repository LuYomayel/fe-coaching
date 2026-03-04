import { createContext, useContext, useRef, useCallback, useMemo } from 'react';
import { Toast, ToastMessage } from 'primereact/toast';

import { ToastContextValue, ToastProviderProps } from '../types/contexts';
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const toastRef = useRef<Toast | null>(null);

  const showToast = useCallback((severity: ToastMessage['severity'], summary: string, detail = '', sticky = false) => {
    if (toastRef.current) toastRef.current.show({ severity, summary, detail, sticky });
    else console.error('Toast ref is not initialized');
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <Toast ref={toastRef} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
