import { useState, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useSpinner } from '../../utils/GlobalSpinner';
import { api } from '../../services/api-client';
import { formatDate, formatDateToApi, mapSessionToCalendarEvent } from '../../utils/UtilFunctions';
import { ClientData } from '../../pages/ClientDashboard';

interface CalendarEvent {
  title: string;
  start: string;
  allDay: boolean;
  extendedProps?: {
    sessionId?: number;
    status?: string;
    workoutInstanceId?: number;
    cycle?: any;
    sessionMode?: string;
    location?: string;
    sessionTime?: string;
    contactMethod?: string;
    notes?: string;
  };
}

interface CycleOption {
  label: string;
  value: number;
}

interface TrainingCycleTemplate {
  id: number;
  name: string;
  duration: number;
  isDurationInMonths: boolean;
  trainingWeeks?: Array<{
    trainingSessions?: Array<{
      workoutInstances?: Array<{
        workout?: {
          planName: string;
        };
      }>;
      workout?: {
        planName: string;
      };
    }>;
  }>;
}

interface UseCalendarTabProps {
  clientId: string;
  clientData: ClientData | null;
  refreshKey: number;
  setRefreshKey: (value: number | ((prev: number) => number)) => void;
}

export const useCalendarTab = ({ clientId, clientData, refreshKey, setRefreshKey }: UseCalendarTabProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { setLoading } = useSpinner();

  // Calendar states
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendarRef = useRef<any>(null);

  // Cycle dialogs states
  const [assignCycleVisible, setAssignCycleVisible] = useState(false);
  const [cycleDropdownOptions, setCycleDropdownOptions] = useState<CycleOption[]>([]);
  const [actionType, setActionType] = useState<'assign' | 'unassign'>('assign');

  // Create cycle dialog state
  const [dialogVisible, setDialogVisible] = useState(false);

  // Session dialog states
  const [assignSessionVisible, setAssignSessionVisible] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Plan details dialog states
  const [planDetailsVisible, setPlanDetailsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  // Assign cycle template dialog states
  const [isAssignCycleTemplateDialogVisible, setAssignCycleTemplateDialogVisible] = useState(false);
  const [trainingCycleTemplates, setTrainingCycleTemplates] = useState<TrainingCycleTemplate[]>([]);
  const [selectedCycleTemplate, setSelectedCycleTemplate] = useState<TrainingCycleTemplate | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Helper function to fetch and map training cycles to calendar events
  const fetchTrainingCyclesEvents = async () => {
    const response = await api.workout.fetchTrainingCyclesByClient(parseInt(clientId));
    if (response.message !== 'success' || !response.data) {
      throw new Error('Error fetching training cycles');
    }

    const cycles = response.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events: any[] = cycles.flatMap((cycle: any) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cycle.trainingWeeks.flatMap((week: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        week.trainingSessions.flatMap((session: any) => {
          if (session.workoutInstances.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return session.workoutInstances.map((workoutInstance: any) =>
              mapSessionToCalendarEvent(session, workoutInstance)
            );
          } else {
            return [mapSessionToCalendarEvent(session, undefined, cycle.name)];
          }
        })
      )
    );

    // Create cycle options for dropdown
    const sortedCycles = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const options: CycleOption[] = sortedCycles.map((cycle) => ({
      label: `${cycle.name} - ${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)}`,
      value: cycle.id
    }));
    options.unshift({
      label: intl.formatMessage({ id: 'clientDashboard.cycle.createNewCycle' }),
      value: -1
    });
    setCycleDropdownOptions(options);

    return events;
  };

  // Helper function to fetch and map training sessions without week to calendar events
  const fetchTrainingSessionsWithoutWeekEvents = async () => {
    const response = await api.workout.fetchTrainingSessionsWithoutWeekByClient(parseInt(clientId));
    if (response.message !== 'success' || !response.data) {
      throw new Error('Error fetching training sessions');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((session: any) => {
      const workoutInstance = session.workoutInstances?.[0];
      return mapSessionToCalendarEvent(session, workoutInstance);
    });
  };

  // Fetch calendar data
  useEffect(() => {
    setLoading(true);
    setCalendarEvents([]);

    Promise.all([fetchTrainingCyclesEvents(), fetchTrainingSessionsWithoutWeekEvents()])
      .then(([cycleEvents, sessionEvents]) => {
        setCalendarEvents([...cycleEvents, ...sessionEvents] as CalendarEvent[]);
      })
      .catch((error) => {
        showToast('error', 'Error fetching calendar data', error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clientId, refreshKey, intl, showToast, setLoading]);

  // Fetch training cycle templates
  useEffect(() => {
    const fetchTrainingCyclesTemplates = async () => {
      const response = await api.workout.fetchTrainingCyclesTemplatesByCoachId();
      if (response.message !== 'success' || !response.data) {
        throw new Error('Error fetching training cycles templates');
      }
      setTrainingCycleTemplates(response.data as any);
    };
    if (clientData?.coach?.id !== undefined) {
      fetchTrainingCyclesTemplates();
    }
  }, [clientData?.coach?.id, refreshKey]);

  // Handlers
  const handleViewWorkoutDetails = (workoutInstanceId: number) => {
    setLoading(true);
    setSelectedPlan(workoutInstanceId);
    setPlanDetailsVisible(true);
  };

  const hidePlanDetails = () => {
    setPlanDetailsVisible(false);
    setSelectedPlan(null);
  };

  const handleAssignDayWorkout = (sessionId: number) => {
    setSelectedClient(clientId);
    setSelectedSessionId(sessionId);
    setAssignSessionVisible(true);
  };

  const showCreateCycleDialog = () => {
    if (clientData?.user?.subscription?.status === 'Active') {
      setDialogVisible(true);
    } else {
      showToast('error', 'Error', intl.formatMessage({ id: 'student.error.noSubscription' }));
    }
  };

  const hideCreateCycleDialog = () => {
    setRefreshKey((old: number) => old + 1);
    setDialogVisible(false);
  };

  const handleOpenAssignCycle = (action: 'assign' | 'unassign') => {
    setSelectedClient(clientId);
    setActionType(action);
    setAssignCycleVisible(true);
  };

  const openAssignCycleTemplateDialog = () => {
    setAssignCycleTemplateDialogVisible(true);
    setSelectedCycleTemplate(null);
    setStartDate(null);
    setEndDate(null);
  };

  const handleAssignCycleTemplateToClient = async () => {
    if (!selectedCycleTemplate || !startDate || !endDate) {
      showToast(
        'error',
        'Error',
        intl.formatMessage({
          id: 'clientDashboard.error.selectCycleAndDates',
          defaultMessage: 'Por favor seleccione un ciclo de entrenamiento y fechas de inicio/fin.'
        })
      );
      return;
    }

    setLoading(true);
    const startDateNewDate = new Date(startDate);
    const endDateNewDate = new Date(endDate);

    try {
      const payload = {
        cycleTemplateId: selectedCycleTemplate.id,
        clientId: parseInt(clientId),
        startDate: formatDateToApi(startDateNewDate),
        endDate: formatDateToApi(endDateNewDate)
      };

      const response = await api.workout.assignCycleTemplateToClient(payload);

      if (!response.success) {
        throw new Error(response.message || 'Error al asignar ciclo');
      }

      showToast(
        'success',
        intl.formatMessage({
          id: 'clientDashboard.success',
          defaultMessage: 'Éxito'
        }),
        intl.formatMessage({
          id: 'clientDashboard.success.cycleAssigned',
          defaultMessage: 'Ciclo de entrenamiento asignado correctamente.'
        })
      );
      setAssignCycleTemplateDialogVisible(false);
      setRefreshKey((prev: number) => prev + 1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Ocurrió un error al asignar el ciclo de entrenamiento.');
    } finally {
      setLoading(false);
      setSelectedCycleTemplate(null);
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleAddDayWorkout = (date: string) => {
    setSelectedDate(date);
    setSelectedClient(clientId);
    setSelectedSessionId(null);
    setAssignSessionVisible(true);
  };

  const navigateToTrainingSession = (workoutInstanceId: number) => {
    navigate(`/plans/start-session/${workoutInstanceId}`, {
      state: {
        isTraining: true,
        planId: workoutInstanceId,
        clientId: clientId
      }
    });
  };

  return {
    // Calendar
    calendarEvents,
    calendarRef,

    // Cycle dialogs
    assignCycleVisible,
    setAssignCycleVisible,
    cycleDropdownOptions,
    actionType,
    handleOpenAssignCycle,

    // Create cycle dialog
    dialogVisible,
    showCreateCycleDialog,
    hideCreateCycleDialog,

    // Session dialog
    assignSessionVisible,
    setAssignSessionVisible,
    selectedSessionId,
    selectedDate,
    selectedClient,
    handleAssignDayWorkout,
    handleAddDayWorkout,

    // Plan details dialog
    planDetailsVisible,
    setPlanDetailsVisible,
    selectedPlan,
    handleViewWorkoutDetails,
    hidePlanDetails,

    // Assign cycle template dialog
    isAssignCycleTemplateDialogVisible,
    setAssignCycleTemplateDialogVisible,
    trainingCycleTemplates,
    selectedCycleTemplate,
    setSelectedCycleTemplate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    openAssignCycleTemplateDialog,
    handleAssignCycleTemplateToClient,

    // Utilities
    navigateToTrainingSession,
    setLoading
  };
};
