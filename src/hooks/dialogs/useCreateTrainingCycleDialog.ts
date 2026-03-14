import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { useRpeMethods } from '../coach/useRpeMethods';
import { api } from '../../services/api-client';
import { formatDateToApi } from '../../utils/UtilFunctions';

interface IAssignment {
  workoutId: number | null;
  dayOfWeek: number | null;
  rpeMethodId: number | null;
}

interface IRpeMethod {
  id: number;
  name: string;
}

interface ICycleTemplate {
  id: number;
  name: string;
  duration: number;
  isDurationInMonths: boolean;
  [key: string]: unknown;
}

interface IWorkoutOption {
  id: number;
  planName: string;
}

interface IBodyCycle {
  name: string;
  startDate: string;
  clientId: number;
  durationInMonths: number | null;
  durationInWeeks: number | null;
}

interface IUseCreateTrainingCycleDialogProps {
  visible: boolean;
  onHide: () => void;
  clientId: number | string;
  setRefreshKey: (_fn: (_old: number) => number) => void;
}

export function useCreateTrainingCycleDialog({
  visible,
  onHide,
  clientId,
  setRefreshKey
}: IUseCreateTrainingCycleDialogProps) {
  const intl = useIntl();
  const { user, coach } = useUser();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { rpeMethods, defaultRpeMethod } = useRpeMethods();

  const [cycleName, setCycleName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [durationInMonths, setDurationInMonths] = useState<number | null>(null);
  const [durationInWeeks, setDurationInWeeks] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [workouts, setWorkouts] = useState<IWorkoutOption[]>([]);
  const [bodyCycle, setBodyCycle] = useState<IBodyCycle | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [trainingCycleTemplates, setTrainingCycleTemplates] = useState<ICycleTemplate[]>([]);
  const [selectedCycleTemplate, setSelectedCycleTemplate] = useState<ICycleTemplate | null>(null);
  const [templateStartDate, setTemplateStartDate] = useState<Date | null>(null);
  const [templateEndDate, setTemplateEndDate] = useState<Date | null>(null);

  const [globalRpeMethod, setGlobalRpeMethod] = useState<IRpeMethod | null>(null);
  const [useGlobalRpe, setUseGlobalRpe] = useState(true);
  const [templateRpeMethod, setTemplateRpeMethod] = useState<IRpeMethod | null>(null);

  const daysOfWeek = [
    { label: intl.formatMessage({ id: 'workoutTable.monday' }), value: 1 },
    { label: intl.formatMessage({ id: 'workoutTable.tuesday' }), value: 2 },
    { label: intl.formatMessage({ id: 'workoutTable.wednesday' }), value: 3 },
    { label: intl.formatMessage({ id: 'workoutTable.thursday' }), value: 4 },
    { label: intl.formatMessage({ id: 'workoutTable.friday' }), value: 5 },
    { label: intl.formatMessage({ id: 'workoutTable.saturday' }), value: 6 },
    { label: intl.formatMessage({ id: 'workoutTable.sunday' }), value: 7 }
  ];

  useEffect(() => {
    if (defaultRpeMethod) {
      setGlobalRpeMethod(defaultRpeMethod);
      setTemplateRpeMethod(defaultRpeMethod);
    }
  }, [defaultRpeMethod]);

  useEffect(() => {
    setAssignments([{ workoutId: null, dayOfWeek: null, rpeMethodId: null }]);
    setTemplateStartDate(null);
    setTemplateEndDate(null);
    setSelectedCycleTemplate(null);
    setGlobalRpeMethod(null);
    setUseGlobalRpe(true);
    setTemplateRpeMethod(null);
  }, []);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const { data } = await api.workout.findAllWorkoutTemplatesByCoachId();
        setWorkouts(data ?? []);
      } catch (error) {
        showToast('error', 'Error', (error as Error).message);
      }
    };

    const loadCycleTemplates = async () => {
      try {
        const { data } = await api.workout.fetchTrainingCyclesTemplatesByCoachId();
        setTrainingCycleTemplates((data as unknown as ICycleTemplate[]) ?? []);
      } catch (error) {
        console.error('Error fetching training cycle templates:', error);
        showToast('error', 'Error', intl.formatMessage({ id: 'error' }));
      }
    };

    if (visible) {
      loadWorkouts();
      loadCycleTemplates();
    }
  }, [showToast, user?.userId, visible, coach?.id]); // eslint-disable-line

  const handleCreateCycle = async (body: IBodyCycle) => {
    try {
      setLoading(true);
      await api.workout.createTrainingCycle(body);
      showToast('success', intl.formatMessage({ id: 'success.cycleCreated' }));
      onHide();
    } catch (error) {
      showToast('error', intl.formatMessage({ id: 'error' }), (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onDurationMonthChange = (value: number | null) => {
    setDurationInMonths(value);
    setDurationInWeeks(null);
  };

  const onDurationWeekChange = (value: number | null) => {
    setDurationInWeeks(value);
    setDurationInMonths(null);
  };

  const clickCreateCycle = () => {
    if (!cycleName || !startDate) {
      showToast('error', intl.formatMessage({ id: 'error' }), intl.formatMessage({ id: 'error.allFieldsRequired' }));
      return;
    }

    if (!durationInMonths && !durationInWeeks) {
      showToast('error', intl.formatMessage({ id: 'error' }), intl.formatMessage({ id: 'error.enterDuration' }));
      return;
    }

    const body = {
      name: cycleName,
      startDate: formatDateToApi(startDate as Date),
      clientId: parseInt(String(clientId)),
      durationInMonths,
      durationInWeeks
    };

    showConfirmationDialog({
      message: intl.formatMessage({ id: 'createCycle.button.create.confirm' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: () => handleCreateCycle(body)
    });
  };

  const clickGoNextTab = () => {
    setActiveIndex(1);
    const body: IBodyCycle = {
      name: cycleName,
      startDate: formatDateToApi(startDate as Date),
      clientId: parseInt(String(clientId)),
      durationInMonths,
      durationInWeeks
    };
    setBodyCycle(body);
  };

  const handleAddAssignment = () => {
    const last = assignments[assignments.length - 1];
    if (!last || !last.workoutId || last.dayOfWeek === null) {
      return showToast(
        'error',
        'Error',
        intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.selectWorkoutAndDay' })
      );
    }
    setAssignments([...assignments, { workoutId: null, dayOfWeek: null, rpeMethodId: null }]);
  };

  const handleAssignmentChange = (index: number, field: keyof IAssignment, value: number | null) => {
    setAssignments((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeAssignment = (index: number) => {
    const updated = assignments.filter((_, i) => index !== i);
    if (updated.length > 0) {
      setAssignments(updated);
    } else {
      showToast(
        'error',
        'Error',
        intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.selectAtLeastOneWorkout' })
      );
    }
  };

  const handleAction = async () => {
    const processedAssignments = assignments
      .filter((assignment) => assignment.dayOfWeek !== null && assignment.workoutId !== null)
      .map((assignment) => ({
        ...assignment,
        rpeMethodId: useGlobalRpe ? (globalRpeMethod?.id ?? null) : assignment.rpeMethodId
      }));

    const body = {
      clientId: parseInt(String(clientId)),
      createCycleDto: bodyCycle,
      assignWorkoutsToCycleDTO: {
        assignments: processedAssignments
      }
    };
    if (body.assignWorkoutsToCycleDTO.assignments.length === 0)
      return showToast('error', 'Error', 'Please select at least one workout.');

    try {
      setLoading(true);
      const { data } = await api.workout.createCycleAndAssignWorkouts(body);

      if (data && data.trainingSessions && data.trainingSessions.length > 0) {
        showToast(
          'success',
          intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.assign' }),
          intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.assign.detail' })
        );
      } else {
        showToast(
          'error',
          intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.assign' }),
          intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.assign.detail' })
        );
      }

      onHide();
      setRefreshKey((old) => old + 1);
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCycleTemplate = async () => {
    if (!selectedCycleTemplate || !templateStartDate || !templateEndDate) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({
          id: 'clientDashboard.error.selectCycleAndDates',
          defaultMessage: 'Por favor seleccione un ciclo de entrenamiento y fechas de inicio/fin.'
        })
      );
      return;
    }

    if (!templateRpeMethod) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        intl.formatMessage({
          id: 'createCycle.error.selectRpeMethod',
          defaultMessage: 'Por favor seleccione un método RPE.'
        })
      );
      return;
    }

    setLoading(true);
    const startDateNewDate = new Date(templateStartDate);
    const endDateNewDate = new Date(templateEndDate);

    try {
      const payload = {
        cycleTemplateId: selectedCycleTemplate.id,
        clientId: parseInt(String(clientId)),
        startDate: formatDateToApi(startDateNewDate),
        endDate: formatDateToApi(endDateNewDate),
        rpeMethodId: templateRpeMethod.id
      };

      await api.workout.assignCycleTemplateToClient(payload);
      showToast(
        'success',
        intl.formatMessage({ id: 'clientDashboard.success', defaultMessage: 'Éxito' }),
        intl.formatMessage({
          id: 'clientDashboard.success.cycleAssigned',
          defaultMessage: 'Ciclo de entrenamiento asignado correctamente.'
        })
      );
      onHide();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      showToast(
        'error',
        intl.formatMessage({ id: 'error' }),
        (error as Error).message || 'Ocurrió un error al asignar el ciclo de entrenamiento.'
      );
    } finally {
      setLoading(false);
      setSelectedCycleTemplate(null);
      setTemplateStartDate(null);
      setTemplateEndDate(null);
    }
  };

  const handleCycleTemplateChange = (template: ICycleTemplate) => {
    setSelectedCycleTemplate(template);
    if (templateStartDate && template) {
      const endDate = new Date(templateStartDate);
      if (template.isDurationInMonths) {
        endDate.setMonth(endDate.getMonth() + template.duration);
      } else {
        endDate.setDate(endDate.getDate() + template.duration * 7);
      }
      setTemplateEndDate(endDate);
    }
  };

  const handleTemplateStartDateChange = (date: Date | null) => {
    setTemplateStartDate(date);
    if (date && selectedCycleTemplate) {
      const endDate = new Date(date);
      if (selectedCycleTemplate.isDurationInMonths) {
        endDate.setMonth(endDate.getMonth() + selectedCycleTemplate.duration);
      } else {
        endDate.setDate(endDate.getDate() + selectedCycleTemplate.duration * 7);
      }
      setTemplateEndDate(endDate);
    }
  };

  const isNextDisabled = !cycleName || !startDate || (!durationInMonths && !durationInWeeks);

  return {
    intl,
    rpeMethods,
    cycleName,
    setCycleName,
    startDate,
    setStartDate,
    durationInMonths,
    durationInWeeks,
    loading,
    assignments,
    workouts,
    activeIndex,
    setActiveIndex,
    trainingCycleTemplates,
    selectedCycleTemplate,
    templateStartDate,
    templateEndDate,
    globalRpeMethod,
    setGlobalRpeMethod,
    useGlobalRpe,
    setUseGlobalRpe,
    templateRpeMethod,
    setTemplateRpeMethod,
    daysOfWeek,
    onDurationMonthChange,
    onDurationWeekChange,
    clickCreateCycle,
    clickGoNextTab,
    handleAddAssignment,
    handleAssignmentChange,
    removeAssignment,
    handleAction,
    handleAssignCycleTemplate,
    handleCycleTemplateChange,
    handleTemplateStartDateChange,
    isNextDisabled
  };
}
