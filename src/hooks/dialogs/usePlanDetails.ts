import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useUser } from '../../contexts/UserContext';
import { useConfirmationDialog } from '../../utils/ConfirmationDialogContext';
import { useIntl } from 'react-intl';
import { api } from '../../services/api-client';
import { IWorkoutInstance } from '../../types/workout/workout-instance';
import { IExerciseInstance } from '../../types/workout/exercise-instance';
import { IExerciseGroup } from '../../types/workout/exercise-group';
import { IRpeMethod } from '../../types/rpe/rpe-method-assigned';
import { IClient } from '../../types/models';
import { SessionMode } from '../../types/enums/session-mode';
import { extractYouTubeVideoId } from 'utils/UtilFunctions';

interface UsePlanDetailsProps {
  planId: number;
  isTemplate: boolean;
  clientId: string;
  setLoading: (loading: boolean) => void;
  setPlanDetailsVisible: (visible: boolean) => void;
  setRefreshKey: (key: ((prev: number) => number) | number) => void;
}

export const usePlanDetails = ({
  planId,
  isTemplate,
  clientId,
  setLoading,
  setPlanDetailsVisible,
  setRefreshKey
}: UsePlanDetailsProps) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { showConfirmationDialog } = useConfirmationDialog();
  const { showToast } = useToast();

  const [rpeMethod, setRpeMethod] = useState<IRpeMethod | null>(null);
  const [videoDialogVisible, setVideoDialogVisible] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [currentCycle, setCurrentCycle] = useState<{ id: number } | null>(null);
  const [clientData, setClientData] = useState<IClient | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<Partial<IWorkoutInstance> & { isTemplate?: boolean }>({
    groups: [],
    status: ''
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedLocation, setEditedLocation] = useState<string>('');
  const [editedContactMethod, setEditedContactMethod] = useState<string>('');
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [editedSessionTime, setEditedSessionTime] = useState<Date | null>(null);
  const [editedSessionMode, setEditedSessionMode] = useState<string>('');

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const { data } =
          user?.userType === 'client'
            ? await api.user.fetchMyClientProfile()
            : await api.user.fetchClientByClientId(Number(clientId));
        setClientData(data);
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };
    if (clientId || user?.userType === 'client') {
      fetchClientData();
    }
  }, [clientId, user?.userType]);

  // Fetch plan details
  useEffect(() => {
    const fetchPlanDetails = async () => {
      try {
        setLoading(true);
        const { data } = isTemplate
          ? await api.workout.fetchWorkoutInstanceTemplate(planId)
          : await api.workout.fetchWorkoutInstance(planId);
        const trainingCycle = data.trainingSession?.trainingWeek?.trainingCycle || null;
        setCurrentCycle(trainingCycle);

        // Sort groups by groupNumber
        data.groups.sort((a: IExerciseGroup, b: IExerciseGroup) => a.groupNumber - b.groupNumber);

        // Normalize empty exercise props
        data.groups.forEach((group: IExerciseGroup) => {
          group.exercises.forEach((exercise: IExerciseInstance) => {
            const props: (keyof IExerciseInstance)[] = [
              'sets',
              'repetitions',
              'tempo',
              'time',
              'weight',
              'restInterval',
              'difficulty',
              'duration',
              'distance'
            ];
            props.forEach((prop) => {
              if (exercise[prop] === '') {
                (exercise[prop] as string | undefined) = undefined;
              }
            });
          });
        });

        setWorkoutPlan(data);

        console.log('data', data);
        // Initialize editable fields
        setEditedLocation(data.trainingSession?.location || '');
        setEditedContactMethod(data.trainingSession?.contactMethod || '');
        setEditedNotes(data.trainingSession?.notes || '');
        setEditedSessionTime(data.trainingSession?.sessionTime ? new Date(data.trainingSession.sessionTime) : null);
        setEditedSessionMode(data.trainingSession?.sessionMode || '');
      } catch (error: unknown) {
        const err = error as Error;
        showToast('error', 'Error fetching plan details', err.message);
      } finally {
        setLoading(false);
      }
    };
    if (planId) fetchPlanDetails();
  }, [planId, isTemplate, setLoading, showToast]);

  // Fetch RPE methods
  useEffect(() => {
    const fetchRpeMethods = async () => {
      try {
        const { data } =
          user?.userType === 'client'
            ? await api.rpe.getMyRpeMethod(planId, currentCycle?.id || -1)
            : await api.rpe.getRpeMethodAssigned(Number(clientId), planId, currentCycle?.id || -1);

        if (data) {
          setRpeMethod(data);
        } else {
          console.warn('No RPE method found in response');
          setRpeMethod(null);
        }
      } catch (error) {
        console.error('Error fetching RPE method:', error);
        showToast('error', 'Error', 'No se pudieron cargar los métodos RPE');
        setRpeMethod(null);
      }
    };
    if (!isTemplate && currentCycle) {
      fetchRpeMethods();
    }
  }, [isTemplate, clientId, planId, currentCycle, showToast]);

  const handleEdit = () => {
    navigate(`/plans/edit/${planId}`, {
      state: { changeToTemplate: false, isTemplate, returnTo: location.pathname + location.search }
    });
  };

  const handleDelete = () => {
    showConfirmationDialog({
      message: intl.formatMessage({ id: 'deletePlan.confirmation.message' }),
      header: intl.formatMessage({ id: 'common.confirmation' }),
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await api.workout.deleteWorkoutPlan(Number(planId), !!workoutPlan.isTemplate);
          if (response.message === 'success') {
            setPlanDetailsVisible(false);
            showToast(
              'success',
              intl.formatMessage({ id: 'coach.plan.success.deleted' }),
              intl.formatMessage(
                { id: 'coach.plan.success.deleted.message' },
                { name: workoutPlan.workoutTemplate?.planName || '' }
              )
            );
          } else {
            showToast('error', 'Error', response.error);
          }
        } catch (error: unknown) {
          const err = error as Error;
          showToast('error', 'Error', err.message);
        }
      }
    });
  };

  // Determinar si se puede iniciar el entrenamiento
  const canStartWorkout = (): boolean => {
    if (!user) return false;

    const isCompleted = workoutPlan.status === 'completed';
    const sessionMode = workoutPlan.trainingSession?.sessionMode;

    // Cliente puede iniciar si no está completado
    if (user.userType === 'client') {
      return !isCompleted;
    }

    // Coach puede iniciar solo si es presencial y no está completado
    if (user.userType === 'coach') {
      return sessionMode === 'presencial' && !isCompleted;
    }

    return false;
  };

  const handleStartWorkout = () => {
    if (!user) return;

    navigate(`/plans/start-session/${planId}`, {
      state: {
        isTraining: true,
        planId: workoutPlan.id || planId,
        sessionMode: workoutPlan.trainingSession?.sessionMode,
        location: workoutPlan.trainingSession?.location,
        contactMethod: workoutPlan.trainingSession?.contactMethod,
        isCoach: user.userType === 'coach',
        clientId: clientId
      }
    });
  };

  const handleVideoClick = (url: string) => {
    try {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        setSelectedVideo(`https://www.youtube.com/embed/${videoId}`);
        setVideoDialogVisible(true);
      } else {
        throw new Error('Invalid YouTube URL');
      }
    } catch (error: unknown) {
      const err = error as Error;
      showToast('error', 'Error', err.message);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);

      const updatedData = {
        location: editedLocation,
        contactMethod: editedContactMethod,
        notes: editedNotes,
        sessionTime: editedSessionTime
          ? `${editedSessionTime.getHours().toString().padStart(2, '0')}:${editedSessionTime.getMinutes().toString().padStart(2, '0')}`
          : undefined,
        sessionMode: editedSessionMode
      };

      await api.workout.updateWorkoutInstance(planId, updatedData);

      setWorkoutPlan((prev) => ({
        ...prev,
        trainingSession: prev.trainingSession
          ? {
              ...prev.trainingSession,
              location: editedLocation,
              contactMethod: editedContactMethod,
              notes: editedNotes,
              sessionTime: editedSessionTime ? editedSessionTime.toISOString() : undefined,
              sessionMode: editedSessionMode as SessionMode
            }
          : undefined
      }));

      setIsEditing(false);
      showToast('success', 'Cambios guardados', 'Los cambios se han guardado correctamente');
      setRefreshKey((prev: number) => prev + 1);
    } catch (error: unknown) {
      const err = error as Error;
      showToast('error', 'Error al guardar los cambios', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedLocation(workoutPlan.trainingSession?.location || '');
    setEditedContactMethod(workoutPlan.trainingSession?.contactMethod || '');
    setEditedNotes(workoutPlan.trainingSession?.notes || '');
    setEditedSessionTime(
      workoutPlan.trainingSession?.sessionTime ? new Date(workoutPlan.trainingSession.sessionTime) : null
    );
    setEditedSessionMode(workoutPlan.trainingSession?.sessionMode || '');
    setIsEditing(false);
  };

  return {
    // State
    workoutPlan,
    rpeMethod,
    videoDialogVisible,
    selectedVideo,
    clientData,
    isEditing,
    editedLocation,
    editedContactMethod,
    editedNotes,
    editedSessionTime,
    editedSessionMode,
    user,

    // Setters
    setVideoDialogVisible,
    setIsEditing,
    setEditedLocation,
    setEditedContactMethod,
    setEditedNotes,
    setEditedSessionTime,
    setEditedSessionMode,

    // Handlers
    handleEdit,
    handleDelete,
    handleStartWorkout,
    handleVideoClick,
    handleSaveChanges,
    handleCancelEdit,
    canStartWorkout
  };
};
