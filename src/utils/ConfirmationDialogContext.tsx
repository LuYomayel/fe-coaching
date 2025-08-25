// src/contexts/ConfirmationDialogContext.tsx
'use client';
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ConfirmDialog } from 'primereact/confirmdialog';

interface ConfirmationDialogState {
  visible: boolean;
  message: string;
  header: string;
  icon: string;
  accept: (() => void) | undefined;
  reject: (() => void) | undefined;
}

interface ShowConfirmationDialogProps {
  message: string;
  header: string;
  icon: string;
  accept: () => void;
  reject: () => void;
}

interface ConfirmationDialogContextType {
  showConfirmationDialog: (props: ShowConfirmationDialogProps) => void;
}

interface ConfirmationDialogProviderProps {
  children: ReactNode;
}

const ConfirmationDialogContext = createContext<ConfirmationDialogContextType | undefined>(undefined);

export const useConfirmationDialog = (): ConfirmationDialogContextType => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error('useConfirmationDialog must be used within a ConfirmationDialogProvider');
  }
  return context;
};

export const ConfirmationDialogProvider: React.FC<ConfirmationDialogProviderProps> = ({ children }) => {
  const [confirmationDialogState, setConfirmationDialogState] = useState<ConfirmationDialogState>({
    visible: false,
    message: '',
    header: '',
    icon: '',
    accept: undefined,
    reject: undefined
  });

  const showConfirmationDialog = useCallback(
    ({ message, header, icon, accept, reject }: ShowConfirmationDialogProps) => {
      setConfirmationDialogState({
        visible: true,
        message,
        header,
        icon,
        accept,
        reject
      });
    },
    []
  );

  const hideConfirmationDialog = useCallback(() => {
    setConfirmationDialogState((prevState) => ({
      ...prevState,
      visible: false
    }));
  }, []);

  return (
    <ConfirmationDialogContext.Provider value={{ showConfirmationDialog }}>
      {children}
      <ConfirmDialog
        visible={confirmationDialogState.visible}
        onHide={hideConfirmationDialog}
        message={confirmationDialogState.message}
        header={confirmationDialogState.header}
        icon={confirmationDialogState.icon}
        accept={confirmationDialogState.accept}
        reject={confirmationDialogState.reject}
      />
    </ConfirmationDialogContext.Provider>
  );
};
