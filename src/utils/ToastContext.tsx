'use client';
import React, { createContext, useContext, useRef, ReactNode, useCallback } from 'react';
import { Toast } from 'primereact/toast';

type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

type ShowToastFunction = (severity: ToastSeverity, summary: string, detail?: string, sticky?: boolean) => void;

interface ToastProviderProps {
  children: ReactNode;
}

const ToastContext = createContext<ShowToastFunction | undefined>(undefined);

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const toastRef = useRef<Toast>(null);

  const showToast: ShowToastFunction = useCallback((severity, summary, detail, sticky) => {
    toastRef.current?.show({ severity, summary, detail, sticky });
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <Toast ref={toastRef} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ShowToastFunction => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
