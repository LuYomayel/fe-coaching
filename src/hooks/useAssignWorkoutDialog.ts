import { useState } from 'react';

export function useAssignWorkoutDialog() {
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [selectedWorkouts, setSelectedWorkouts] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const handleOpenDialog = (workouts: any[]) => {
    setSelectedWorkouts(workouts);
    setDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
    setSelectedWorkouts([]);
    setSelectedClient(null);
  };

  return {
    isDialogVisible,
    selectedWorkouts,
    selectedClient,
    setSelectedClient,
    handleOpenDialog,
    handleCloseDialog,
    setDialogVisible
  };
}


