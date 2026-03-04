import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { api } from '../../services/api-client';

interface IWorkoutTemplate {
  id: number;
  planName: string;
}

interface IWorkoutOption {
  label: string;
  value: number;
}

interface ICycleOption {
  label: string;
  value: number;
}

interface IAssignment {
  workoutId: number | null;
  dayOfWeek: number | null;
}

interface IVerificationResult {
  hasSetLogs: boolean;
  setLogsCount: number;
}

interface IUseAssignWorkoutToCycleDialogProps {
  visible: boolean;
  onHide: () => void;
  clientId: number | string;
  setRefreshKey: (fn: (old: number) => number) => void;
  cycleOptions: ICycleOption[];
  actionType: 'assign' | 'unassign';
}

export function useAssignWorkoutToCycleDialog({
  visible,
  onHide,
  clientId,
  setRefreshKey,
  cycleOptions,
  actionType
}: IUseAssignWorkoutToCycleDialogProps) {
  const intl = useIntl();
  const { showToast } = useToast();
  const { coach } = useUser();

  const [workouts, setWorkouts] = useState<IWorkoutTemplate[]>([]);
  const [assignments, setAssignments] = useState<IAssignment[]>([{ workoutId: null, dayOfWeek: null }]);
  const [cycle, setCycle] = useState(-1);
  const [cycles, setCycles] = useState<ICycleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [assignedWorkouts, setAssignedWorkouts] = useState<IWorkoutOption[]>([]);
  const [unassignOption, setUnassignOption] = useState<'day' | 'cycle'>('day');
  const [verificationResult, setVerificationResult] = useState<IVerificationResult | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);

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
    if (visible) {
      setAssignments([{ workoutId: null, dayOfWeek: null }]);
      setCycle(-1);
      setSelectedDay(null);
      setAssignedWorkouts([]);
      setUnassignOption('day');
      setVerificationResult(null);
      setForceDelete(false);
      setShowVerificationDialog(false);
    }
  }, [visible]);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const { data } = await api.workout.findAllWorkoutTemplatesByCoachId();
        setWorkouts(data ?? []);
      } catch (error) {
        showToast('error', 'Error', (error as Error).message);
      }
    };

    if (visible) loadWorkouts();
  }, [showToast, coach?.id, visible]); // eslint-disable-line

  useEffect(() => {
    if (cycleOptions && visible) {
      setCycles(cycleOptions);
    }
  }, [cycleOptions, visible]);

  useEffect(() => {
    const loadAssignedWorkouts = async () => {
      if (actionType === 'unassign' && cycle !== -1 && selectedDay !== null && unassignOption === 'day') {
        try {
          const { data } = await api.workout.fetchAssignedWorkoutsForCycleDay(cycle, selectedDay);
          setAssignedWorkouts(
            (data ?? []).map((workout: { planName: string; id: number }) => ({
              label: workout.planName,
              value: workout.id
            }))
          );
        } catch (error) {
          showToast('error', 'Error fetching assigned workouts', (error as Error).message);
        }
      }
    };

    loadAssignedWorkouts();
  }, [showToast, actionType, cycle, selectedDay, unassignOption]);

  const handleVerifyDeletion = async () => {
    if (cycle === -1) return showToast('error', 'Error', 'Please select a cycle.');

    try {
      setLoading(true);
      const { data } = await api.workout.verifyTrainingCycleDeletion(cycle);
      setVerificationResult(data);
      setShowVerificationDialog(true);
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (cycle === -1) return showToast('error', 'Error', 'Please select a cycle.');

    try {
      setLoading(true);
      if (actionType === 'assign') {
        const body = {
          assignments: assignments.filter(
            (assignment) => assignment.dayOfWeek !== null && assignment.workoutId !== null
          )
        };
        if (body.assignments.length === 0) return showToast('error', 'Error', 'Please select at least one workout.');

        const { data } = await api.workout.assignWorkoutsToCycle(cycle, Number(clientId), body);
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
      } else {
        if (unassignOption === 'day') {
          if (selectedDay === null) {
            return showToast('error', 'Error', 'Please select a day of the week.');
          }

          const body = {
            assignments: assignments.filter(
              (assignment) => assignment.dayOfWeek !== null && assignment.workoutId !== null
            )
          };

          if (body.assignments.length === 0) {
            return showToast('error', 'Error', 'Please select at least one workout to unassign.');
          }

          const { message } = await api.workout.unassignWorkoutsFromCycle(cycle, body);
          if (message === 'success') {
            showToast(
              'success',
              intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.unassign' }),
              intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.unassign.detail' })
            );
          } else {
            showToast(
              'error',
              intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.unassign' }),
              intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.unassign.detail' })
            );
          }
        } else {
          if (!showVerificationDialog) {
            await handleVerifyDeletion();
            return;
          }

          const { message } = await api.workout.deleteTrainingCycle(cycle, forceDelete);
          if (message === 'success') {
            showToast(
              'success',
              intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.deleteCycle' }),
              intl.formatMessage({ id: 'assignWorkoutToCycleDialog.success.deleteCycle.detail' })
            );
            setShowVerificationDialog(false);
            onHide();
            setSelectedDay(null);
            setRefreshKey((old) => old + 1);
          } else {
            showToast(
              'error',
              intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.deleteCycle' }),
              intl.formatMessage({ id: 'assignWorkoutToCycleDialog.error.deleteCycle.detail' })
            );
          }
        }
      }
      if (actionType === 'assign' || unassignOption === 'day') {
        onHide();
        setSelectedDay(null);
        setRefreshKey((old) => old + 1);
      }
    } catch (error) {
      showToast('error', 'Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
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
    setAssignments([...assignments, { workoutId: null, dayOfWeek: null }]);
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

  const handleCycleChange = (value: number) => {
    setCycle(value);
    if (actionType === 'unassign') {
      setSelectedDay(null);
      setAssignedWorkouts([]);
    }
  };

  const handleDayChange = (value: number) => {
    setSelectedDay(value);
    setAssignments([{ workoutId: null, dayOfWeek: value }]);
  };

  return {
    intl,
    workouts,
    assignments,
    cycle,
    cycles,
    loading,
    selectedDay,
    assignedWorkouts,
    unassignOption,
    verificationResult,
    forceDelete,
    showVerificationDialog,
    daysOfWeek,
    setUnassignOption,
    setForceDelete,
    setShowVerificationDialog,
    handleAction,
    handleAddAssignment,
    handleAssignmentChange,
    removeAssignment,
    handleCycleChange,
    handleDayChange
  };
}
