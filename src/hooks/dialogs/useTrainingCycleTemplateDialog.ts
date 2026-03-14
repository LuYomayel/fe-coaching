import { useState } from 'react';
import { useIntl } from 'react-intl';
import { useSpinner } from '../../utils/GlobalSpinner';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api-client';

export function useTrainingCycleTemplateDialog(workouts: any[], deletedWorkoutTemplates: any[], onRefresh: () => void) {
  const [isTemplateDialogVisible, setTemplateDialogVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDuration, setTemplateDuration] = useState<number | null>(null);
  const [templateWeeks, setTemplateWeeks] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [isDurationInWeeks, setIsDurationInWeeks] = useState(true);
  const [applyToAllWeeks, setApplyToAllWeeks] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);

  const intl = useIntl();
  const { setLoading } = useSpinner();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { showToast } = useToast();

  const loadCycleTemplate = async (cycleId: number) => {
    setLoading(true);
    try {
      const { data } = await api.workout.fetchTrainingCycleTemplateById(cycleId);
      const cycle = data;
      setTemplateName(cycle?.name ?? '');
      setTemplateDuration(cycle?.trainingWeeks?.length ?? 0);
      setIsDurationInWeeks(cycle?.isDurationInMonths ?? false);
      const weeks = cycle?.trainingWeeks.map((week: any) => ({
        weekNumber: week.weekNumber,
        trainingSessions: week.trainingSessions.map((session: any) => ({
          dayNumber: session.dayNumber,
          workout: session.workoutInstances[0]?.workout.workoutTemplate.id
        }))
      }));
      setTemplateWeeks(weeks ?? []);
    } catch (error: any) {
      showToast('error', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCycle = (cycleId: number) => {
    setIsReadOnly(false);
    setSelectedCycleId(cycleId);
    loadCycleTemplate(cycleId);
    setTemplateDialogVisible(true);
  };

  const handleViewCycle = (cycleId: number) => {
    setIsReadOnly(true);
    setSelectedCycleId(cycleId);
    loadCycleTemplate(cycleId);
    setTemplateDialogVisible(true);
  };

  const handleDurationTypeChange = (e: any) => {
    const newIsDurationInWeeks = e.checked;
    const totalWeeks = newIsDurationInWeeks ? templateDuration : templateDuration! * 4;

    if (templateWeeks.length > (totalWeeks ?? 0)) {
      showConfirmationDialog({
        message: intl.formatMessage({ id: 'plansPage.confirmation.reduceWeeks' }),
        header: intl.formatMessage({ id: 'common.confirmation' }),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          setIsDurationInWeeks(newIsDurationInWeeks);
          setTemplateWeeks(templateWeeks.slice(0, totalWeeks ?? 0));
        },
        reject: () => {
          console.log('Rejected');
        }
      });
    } else {
      setIsDurationInWeeks(newIsDurationInWeeks);
      if (templateWeeks.length !== totalWeeks) {
        const newWeeks = Array.from({ length: totalWeeks ?? 0 }, (_, i) => ({
          weekNumber: i + 1,
          trainingSessions: []
        }));
        setTemplateWeeks(newWeeks);
      }
    }
  };

  const handleRemoveWorkoutFromWeek = (weekIndex: number, sessionIndex: number) => {
    const updatedWeeks = [...templateWeeks];
    updatedWeeks[weekIndex].trainingSessions.splice(sessionIndex, 1);
    setTemplateWeeks(updatedWeeks);
  };

  const handleAddWorkout = (workoutId: number, dayNumber: number, applyToAll: boolean, weekIndex?: number) => {
    if (!workoutId || !dayNumber) {
      showToast('error', intl.formatMessage({ id: 'plansPage.error.selectWorkoutAndDay' }));
      return;
    }

    if (applyToAll) {
      const updatedWeeks = templateWeeks.map((week) => ({
        ...week,
        trainingSessions: [...week.trainingSessions, { dayNumber, workout: workoutId }]
      }));
      setTemplateWeeks(updatedWeeks);
    } else {
      const targetIndex = weekIndex !== undefined ? weekIndex : 0;
      const updatedWeeks = [...templateWeeks];
      updatedWeeks[targetIndex].trainingSessions.push({ dayNumber, workout: workoutId });
      setTemplateWeeks(updatedWeeks);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName || !templateDuration || templateWeeks.length === 0) {
      showToast('error', intl.formatMessage({ id: 'plansPage.error.allFieldsRequired' }));
      return;
    }

    const payload = {
      name: templateName,
      duration: templateDuration,
      isDurationInMonths: !isDurationInWeeks,
      trainingWeeks: templateWeeks.map((week: any) => ({
        weekNumber: week.weekNumber,
        trainingSessions: week.trainingSessions.map((session: any) => ({
          dayNumber: session.dayNumber,
          workout: session.workout
        }))
      }))
    };

    try {
      setLoading(true);
      if (selectedCycleId) {
        await api.workout.updateTrainingCycle(selectedCycleId, payload);
        showToast('success', intl.formatMessage({ id: 'plansPage.success.cycleUpdated' }));
      } else {
        await api.workout.createTrainingCycleTemplate(payload);
        showToast('success', intl.formatMessage({ id: 'plansPage.success.templateCreated' }));
      }

      setTemplateDialogVisible(false);
      setTemplateName('');
      setTemplateDuration(null);
      setTemplateWeeks([]);
      setSelectedCycleId(null);
      onRefresh();
    } catch (error: any) {
      console.error('Error creating/updating template:', error);
      showToast('error', intl.formatMessage({ id: 'plansPage.error.creatingTemplate' }), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDurationChange = (newDuration: number) => {
    const totalWeeks = isDurationInWeeks ? newDuration : newDuration * 4;

    if (templateWeeks.length > totalWeeks) {
      showConfirmationDialog({
        message: intl.formatMessage({ id: 'plansPage.confirmation.reduceWeeks' }),
        header: intl.formatMessage({ id: 'common.confirmation' }),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          setTemplateDuration(newDuration);
          setTemplateWeeks(templateWeeks.slice(0, totalWeeks));
        },
        reject: () => {
          console.log('Rejected');
        }
      });
    } else {
      setTemplateDuration(newDuration);
      if (templateWeeks.length < totalWeeks) {
        const additionalWeeks = Array.from({ length: totalWeeks - templateWeeks.length }, (_, i) => ({
          weekNumber: templateWeeks.length + i + 1,
          trainingSessions: []
        }));
        setTemplateWeeks([...templateWeeks, ...additionalWeeks]);
      }
    }
  };

  const handleOpenNewTemplate = () => {
    setTemplateDialogVisible(true);
    setSelectedCycleId(null);
    setTemplateName('');
    setTemplateDuration(null);
    setTemplateWeeks([]);
    setIsReadOnly(false);
  };

  const handleCloseDialog = () => {
    setTemplateDialogVisible(false);
    setSelectedCycleId(null);
    setTemplateName('');
    setTemplateDuration(null);
    setTemplateWeeks([]);
    setIsReadOnly(true);
  };

  return {
    isTemplateDialogVisible,
    templateName,
    setTemplateName,
    templateDuration,
    selectedDay,
    setSelectedDay,
    selectedWorkout,
    setSelectedWorkout,
    isDurationInWeeks,
    applyToAllWeeks,
    setApplyToAllWeeks,
    isReadOnly,
    setIsReadOnly,
    selectedCycleId,
    templateWeeks,
    handleEditCycle,
    handleViewCycle,
    handleDurationTypeChange,
    handleRemoveWorkoutFromWeek,
    handleAddWorkout,
    handleCreateTemplate,
    handleDurationChange,
    handleOpenNewTemplate,
    handleCloseDialog,
    workouts,
    deletedWorkoutTemplates
  };
}
