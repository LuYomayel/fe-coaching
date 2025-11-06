import { useState } from 'react';
import { useSpinner } from '../../utils/GlobalSpinner';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api-client';
import { formatDateToApi } from '../../utils/UtilFunctions';

export function useAssignCycleDialog(onSuccess?: () => void) {
  const [isAssignCycleDialogVisible, setAssignCycleDialogVisible] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const { setLoading } = useSpinner();
  const { showToast } = useToast();

  const handleOpenDialog = (cycle: any) => {
    setSelectedCycle(cycle);
    setStartDate(null);
    setEndDate(null);
    setSelectedClient(null);
    setAssignCycleDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setAssignCycleDialogVisible(false);
    setSelectedCycle(null);
    setSelectedClient(null);
    setStartDate(null);
    setEndDate(null);
  };

  const handleAssignCycleToClient = async () => {
    if (!selectedCycle || !selectedClient || !startDate || !endDate) {
      showToast('error', 'Error', 'Please select a cycle, client, and start/end dates.');
      return;
    }
    setLoading(true);
    const startDateNewDate = new Date(startDate);
    const endDateNewDate = new Date(endDate);
    try {
      const payload = {
        cycleTemplateId: selectedCycle.id,
        clientId: selectedClient.id,
        startDate: formatDateToApi(startDateNewDate),
        endDate: formatDateToApi(endDateNewDate)
      };
      await api.workout.assignCycleTemplateToClient(payload);
      showToast('success', 'Success', 'Cycle template assigned to client successfully.');
      handleCloseDialog();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      showToast('error', 'Error', error.message || error.error);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAssignCycleDialogVisible,
    selectedCycle,
    selectedClient,
    setSelectedClient,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleOpenDialog,
    handleCloseDialog,
    handleAssignCycleToClient
  };
}
