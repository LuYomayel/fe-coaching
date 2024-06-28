export const showError = (toastRef, message, life = 3000) => {
  toastRef.current.show({ severity: 'error', summary: 'Error', detail: message, life });
};

export const showSuccess = (toastRef, message, life = 3000) => {
  toastRef.current.show({ severity: 'success', summary: 'Success', detail: message, life });
};

export const showWarning = (toastRef, message, life = 3000) => {
  toastRef.current.show({ severity: 'warn', summary: 'Warning', detail: message, life });
};