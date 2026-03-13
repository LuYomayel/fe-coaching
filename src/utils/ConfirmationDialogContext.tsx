import { createContext, useState, useContext, ReactNode } from 'react';
import { ConfirmDialog } from 'primereact/confirmdialog';

interface IConfirmationDialogParams {
  message: string;
  header: string;
  icon: string;
  accept: (() => void) | null;
  reject?: (() => void) | null;
}

interface IConfirmationDialogState extends IConfirmationDialogParams {
  visible: boolean;
}

interface IConfirmationDialogContextValue {
  showConfirmationDialog: (params: IConfirmationDialogParams) => void;
}

const ConfirmationDialogContext = createContext<IConfirmationDialogContextValue | undefined>(undefined);

export const useConfirmationDialog = (): IConfirmationDialogContextValue => {
  const context = useContext(ConfirmationDialogContext);
  if (!context) {
    throw new Error('useConfirmationDialog must be used within a ConfirmationDialogProvider');
  }
  return context;
};

export const ConfirmationDialogProvider = ({ children }: { children: ReactNode }) => {
  const [confirmationDialogState, setConfirmationDialogState] = useState<IConfirmationDialogState>({
    visible: false,
    message: '',
    header: '',
    icon: '',
    accept: null,
    reject: null
  });

  const showConfirmationDialog = ({ message, header, icon, accept, reject }: IConfirmationDialogParams) => {
    setConfirmationDialogState({
      visible: true,
      message,
      header,
      icon,
      accept,
      reject
    });
  };

  const hideConfirmationDialog = () => {
    setConfirmationDialogState((prevState) => ({
      ...prevState,
      visible: false
    }));
  };

  return (
    <ConfirmationDialogContext.Provider value={{ showConfirmationDialog }}>
      {children}
      <ConfirmDialog
        visible={confirmationDialogState.visible}
        onHide={hideConfirmationDialog}
        message={confirmationDialogState.message}
        header={confirmationDialogState.header}
        icon={confirmationDialogState.icon}
        accept={confirmationDialogState.accept ?? undefined}
        reject={confirmationDialogState.reject ?? undefined}
      />
    </ConfirmationDialogContext.Provider>
  );
};
