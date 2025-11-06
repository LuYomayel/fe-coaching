import { useState } from 'react';

export const useSetConfigDialog = () => {
  const [visible, setVisible] = useState(false);

  const openDialog = () => {
    setVisible(true);
  };

  const closeDialog = () => {
    setVisible(false);
  };

  return {
    visible,
    openDialog,
    closeDialog
  };
};
