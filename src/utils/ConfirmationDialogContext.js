// src/contexts/ConfirmationDialogContext.js
import React, { createContext, useState, useContext } from 'react';
import { ConfirmDialog } from 'primereact/confirmdialog';

const ConfirmationDialogContext = createContext();

export const useConfirmationDialog = () => useContext(ConfirmationDialogContext);

export const ConfirmationDialogProvider = ({ children }) => {
    const [confirmationDialogState, setConfirmationDialogState] = useState({
        visible: false,
        message: '',
        header: '',
        icon: '',
        accept: null,
        reject: null,
    });

    const showConfirmationDialog = ({ message, header, icon, accept, reject }) => {
        setConfirmationDialogState({
            visible: true,
            message,
            header,
            icon,
            accept,
            reject,
        });
    };

    const hideConfirmationDialog = () => {
        setConfirmationDialogState(prevState => ({
            ...prevState,
            visible: false,
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
                accept={confirmationDialogState.accept}
                reject={confirmationDialogState.reject}
            />
        </ConfirmationDialogContext.Provider>
    );
};