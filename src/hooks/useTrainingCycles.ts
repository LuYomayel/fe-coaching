import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useSpinner } from '../utils/GlobalSpinner';
import { useConfirmationDialog } from '../utils/ConfirmationDialogContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api-client';

export function useTrainingCycles() {
  const [trainingCycleTemplates, setTrainingCycleTemplates] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const intl = useIntl();
  const { setLoading } = useSpinner();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { showToast } = useToast();

  useEffect(() => {
    fetchTrainingCyclesT();
    // eslint-disable-next-line
  }, [refreshKey]);

  const fetchTrainingCyclesT = async () => {
    setLoading(true);
    try {
      const response = await api.workout.fetchTrainingCyclesTemplatesByCoachId();
      if (response.message === 'success') {
        setTrainingCycleTemplates(response.data ?? []);
      } else {
        showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), response.message);
      }
    } catch (error: any) {
      console.error('Error fetching training cycle templates:', error);
      showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCycleTemplate = async (cycleTemplateId: number) => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'coach.delete.confirmation' }),
      header: intl.formatMessage({ id: 'coach.delete.header' }),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        setLoading(true);
        try {
          await api.workout.deleteTrainingCycleTemplate(cycleTemplateId);
          setRefreshKey((prev) => prev + 1);
        } catch (error: any) {
          console.error('Error deleting cycle template:', error);
          showToast('error', intl.formatMessage({ id: 'coach.delete.error.generic' }), error.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return {
    trainingCycleTemplates,
    handleDeleteCycleTemplate,
    refreshKey,
    setRefreshKey
  };
}

