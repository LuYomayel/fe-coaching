import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { useUser } from '../../contexts/UserContext';
import { api } from '../../services/api-client';
import { IClient } from 'types/models';
import { ITrainingCycle } from 'types/training-cycle/training-cycle';
import { IWorkoutTemplate } from 'types/workout/workout-template';

export interface TargetOption {
  label: string;
  value: number;
}
export interface RpeMethod {
  id: number;
  name: string;
  minValue: number;
  maxValue: number;
  step: number;
  valuesMeta?: any[];
  isDefault: boolean;
}
export interface RpeAssignment {
  id: number;
  rpeMethod: { id: number };
  targetType: string;
  targetName: string;
  createdAt: string;
}

export const EMOJIS = [
  '😀',
  '😁',
  '😂',
  '🤣',
  '😃',
  '😄',
  '😅',
  '😆',
  '😉',
  '😊',
  '😋',
  '😎',
  '😍',
  '😘',
  '🥰',
  '😗',
  '😙',
  '😚',
  '🙂',
  '🤗',
  '🤩',
  '🤔',
  '🤨',
  '😐',
  '😑',
  '😶',
  '🙄',
  '😏',
  '😣',
  '😥',
  '😮',
  '🤐',
  '😯',
  '😪',
  '😫',
  '🥱',
  '😴',
  '😌',
  '😛',
  '😜',
  '😝',
  '🤤',
  '😒',
  '😓',
  '😔',
  '😕',
  '🙃',
  '🤑',
  '😲',
  '☹️',
  '🙁',
  '😖',
  '😞',
  '😟',
  '😤',
  '😢',
  '😭',
  '😦',
  '😧',
  '😨',
  '😩',
  '🤯',
  '😬',
  '😰',
  '😱',
  '🥵',
  '🥶',
  '😳',
  '🤪',
  '😵',
  '🥴',
  '😠',
  '😡',
  '🤬',
  '😷',
  '🤒',
  '🤕',
  '🤢',
  '🤮',
  '🤧',
  '😇',
  '🥳',
  '🥺',
  '🤠',
  '🤡',
  '🤥',
  '🤫',
  '🤭',
  '🧐',
  '🤓',
  '😈',
  '👹',
  '👺',
  '💀',
  '👻',
  '👽',
  '🤖',
  '💩',
  '😺',
  '😸',
  '😹',
  '😻',
  '😼',
  '��',
  '🙀',
  '😿',
  '😾',
  '🙈',
  '🙉',
  '🙊',
  '💪',
  '👍',
  '👎',
  '👏',
  '🙌',
  '👐',
  '🤲',
  '🤝',
  '🙏',
  '✌️',
  '🤞',
  '🤟',
  '🤘',
  '🤙',
  '👈',
  '👉',
  '👆',
  '🖕',
  '👇',
  '☝️',
  '👋',
  '🤚',
  '🖐️',
  '✋',
  '🖖',
  '👌',
  '✊',
  '👊',
  '🤛',
  '🤜',
  '💅',
  '🚶',
  '🏃',
  '💃',
  '🕺',
  '👨‍❤️‍👨',
  '👩‍❤️‍👩',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🤎',
  '🖤',
  '🤍',
  '💔',
  '❣️',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '💝',
  '💟',
  '💌',
  '💤',
  '💢',
  '💣',
  '💥',
  '💦',
  '💨',
  '💫',
  '🦠',
  '🚨',
  '🔥',
  '👑',
  '💯',
  '🏆'
];

export const useRpeTab = () => {
  const intl = useIntl();
  const { showToast } = useToast();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { user } = useUser();

  const [rpeMethods, setRpeMethods] = useState<RpeMethod[]>([]);
  const [rpeAssignments, setRpeAssignments] = useState<RpeAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);

  const [users, setUsers] = useState<IClient[]>([]);
  const [trainingCycles, setTrainingCycles] = useState<ITrainingCycle[]>([]);
  const [workouts, setWorkouts] = useState<IWorkoutTemplate[]>([]);
  const typeOptions = useMemo(
    () => [
      { label: 'Workout', value: 'workout' },
      { label: 'Training Cycle', value: 'trainingCycle' },
      { label: 'Client', value: 'client' }
    ],
    []
  );

  const targets: TargetOption[] = useMemo(() => {
    if (selectedType === 'workout') return workouts.map((w) => ({ label: w.planName, value: w.id }));
    if (selectedType === 'trainingCycle') return trainingCycles.map((c) => ({ label: c.name, value: c.id }));
    return users.map((u) => ({ label: u.name, value: u.id }));
  }, [selectedType, workouts, trainingCycles, users]);

  const loadStudents = useCallback(async () => {
    try {
      if (!user) return;
      const { data } = await api.coach.fetchStudents();
      setUsers(data ?? []);
    } catch (e) {
      showToast('error', 'Error', (e as Error).message || 'Failed to fetch students');
    }
  }, [user]);

  const loadTrainingCycles = useCallback(async () => {
    try {
      if (!user) return;
      const { data } = await api.trainingCycle.fetchTrainingCycles();
      setTrainingCycles(data ?? []);
    } catch (e) {
      showToast('error', 'Error', (e as Error).message || 'Failed to fetch training cycles');
    }
  }, [user]);

  const loadWorkouts = useCallback(async () => {
    try {
      if (!user) return;
      const { data } = await api.workout.findAllWorkoutTemplatesByCoachId();
      setWorkouts(data ?? []);
    } catch (e) {
      showToast('error', 'Error', (e as Error).message || 'Failed to fetch workouts');
    }
  }, [user]);

  const loadRpeData = useCallback(async () => {
    setLoading(true);
    if (!user) return;
    try {
      const [methodsRes, assignmentsRes] = await Promise.all([api.rpe.getRpeMethods(), api.rpe.getRpeAssignments()]);
      console.log(methodsRes.data);
      setRpeMethods(methodsRes.data ?? []);
      setRpeAssignments(assignmentsRes.data ?? []);
    } catch (e) {
      showToast('error', 'Error', (e as Error).message || 'Failed to fetch RPE data');
    } finally {
      setLoading(false);
    }
  }, [showToast, user]);

  useEffect(() => {
    // carga inicial del tab
    loadRpeData();
    loadStudents();
    loadTrainingCycles();
    loadWorkouts();
  }, []);

  const deleteMethod = useCallback(
    (rpeId: number) => {
      if (!user) return;
      showConfirmationDialog({
        message: intl.formatMessage({ id: 'coach.rpe.confirm.delete' }),
        header: intl.formatMessage({ id: 'common.confirmation' }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          try {
            setLoading(true);
            await api.rpe.deleteRpe(rpeId);
            await loadRpeData();
            showToast('success', 'Success', 'RPE Method deleted successfully');
          } catch (e) {
            showToast('error', 'Error', (e as Error).message);
          } finally {
            setLoading(false);
          }
        }
      });
    },
    [intl, loadRpeData, showConfirmationDialog, showToast, user]
  );

  const getRpeNameById = useCallback(
    (row: RpeAssignment) => {
      const method = rpeMethods.find((m) => m.id === (row.rpeMethod?.id ?? row.rpeMethod));
      return method ? method.name : 'N/A';
    },
    [rpeMethods]
  );

  const formatTargetType = useCallback(
    (type: string) => {
      switch (type) {
        case 'exercise':
          return intl.formatMessage({ id: 'exercise.title' });
        case 'user':
          return intl.formatMessage({ id: 'client.title' });
        default:
          return type;
      }
    },
    [intl]
  );

  return {
    // state
    loading,
    rpeMethods,
    rpeAssignments,
    selectedType,
    selectedTarget,
    selectedRpe,
    typeOptions,
    targets,
    // actions
    setSelectedType,
    setSelectedTarget,
    setSelectedRpe,
    deleteMethod,
    loadRpeData,
    // helpers
    getRpeNameById,
    formatTargetType
  };
};
