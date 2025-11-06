import { createContext, useContext, useRef } from 'react';
import { Toast, ToastMessage } from 'primereact/toast';

import { ToastContextValue, ToastProviderProps } from '../types/contexts';
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const toastRef = useRef<Toast | null>(null);

  const showToast = (severity: ToastMessage['severity'], summary: string, detail?: string, sticky?: boolean) => {
    if (toastRef.current) toastRef.current.show({ severity, summary, detail, sticky });
    else {
      console.error('Toast ref is not initialized');
    }
  };

  return (
    <ToastContext.Provider
      value={{
        showToast: (severity, summary, detail = '', sticky = false) => showToast(severity, summary, detail, sticky)
      }}
    >
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
