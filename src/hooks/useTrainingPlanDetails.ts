/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';

import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useSpinner } from '../utils/GlobalSpinner';
import { api } from '../services/api-client';
import { extractYouTubeVideoId } from '../utils/UtilFunctions';

import { IExerciseGroup } from 'types/workout/exercise-group';
import { IExerciseInstance } from 'types/workout/exercise-instance';
import { ITrainingCycle } from 'types/training-cycle/training-cycle';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ITrainingPlanDetailsProps {
  setPlanDetailsVisible?: (visible: boolean) => void;
  setRefreshKey?: (fn: (old: number) => number) => void;
}

export interface ISetProgress {
  repetitions?: string | null;
  weight?: string | null;
  time?: string | null;
  distance?: string | null;
  tempo?: string | null;
  notes?: string | null;
  difficulty?: string | null;
  duration?: string | null;
  restInterval?: string | null;
  completed?: boolean | null;
  rating?: number | null;
}

export interface IExerciseProgressEntry {
  sets: ISetProgress[];
  completed: boolean | null;
  comments: string;
}

export interface IExerciseProgressMap {
  [exerciseId: string]: IExerciseProgressEntry;
}

export interface IPropertyUnits {
  repetitions?: string;
  weight?: string;
  time?: string;
  distance?: string;
  duration?: string;
  difficulty?: string;
  tempo?: string;
  [key: string]: string | undefined;
}

export interface IFeedbackPayload {
  sessionTime: string | null;
  generalFeedback: string;
  energyLevel: number | null;
  mood: number | null;
  perceivedDifficulty: number | null;
  additionalNotes: string;
}

// The API response includes fields not in the strict IWorkoutInstance type
export interface IPlanData {
  id: number;
  instanceName?: string;
  workout: { planName: string };
  groups: IExerciseGroup[];
  status?: string;
  isTemplate?: boolean;
  trainingSession?: {
    trainingWeek?: {
      trainingCycle?: ITrainingCycle;
    };
  };
  [key: string]: any;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useTrainingPlanDetails = ({ setPlanDetailsVisible, setRefreshKey }: ITrainingPlanDetailsProps) => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { clientId } = (state || {}) as { clientId: number };
  const { user, client, coach } = useUser();
  const { showToast } = useToast();
  const { loading, setLoading } = useSpinner();
  const intl = useIntl();

  const [plan, setPlan] = useState<IPlanData | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState<IExerciseProgressMap>({});
  const [videoDialogVisible, setVideoDialogVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [finishDialogVisible, setFinishDialogVisible] = useState(false);

  const [currentCycle, setCurrentCycle] = useState<ITrainingCycle | number | null>(null);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const propertyUnits: IPropertyUnits = JSON.parse(localStorage.getItem('propertyUnits') || '{}');

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const formatSessionTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const normalizeExerciseProgress = (progress: IExerciseProgressMap): IExerciseProgressMap => {
    const normalizedProgress: IExerciseProgressMap = {};

    Object.entries(progress).forEach(([exerciseId, prog]) => {
      const exerciseData = prog || ({} as IExerciseProgressEntry);

      let setsArray: ISetProgress[] = [];
      if (Array.isArray(exerciseData.sets)) {
        setsArray = exerciseData.sets;
      } else if (exerciseData.sets && typeof exerciseData.sets === 'object') {
        setsArray = Object.values(exerciseData.sets);
      }

      const normalizedSets: ISetProgress[] = setsArray.map((set) => ({
        repetitions: set?.repetitions || null,
        weight: set?.weight || null,
        time: set?.time || null,
        distance: set?.distance || null,
        tempo: set?.tempo || null,
        notes: set?.notes || null,
        difficulty: set?.difficulty || null,
        duration: set?.duration || null,
        restInterval: set?.restInterval || null,
        completed: set?.completed === true ? true : set?.completed === false ? false : null,
        rating: set?.rating || null
      }));

      normalizedProgress[exerciseId] = {
        sets: normalizedSets,
        completed: exerciseData.completed === true ? true : exerciseData.completed === false ? false : null,
        comments: exerciseData.comments || ''
      };
    });

    return normalizedProgress;
  };

  // ---------------------------------------------------------------------------
  // Timer handlers
  // ---------------------------------------------------------------------------

  const handleToggleTimer = () => {
    if (isTimerPaused) {
      const now = Date.now();
      const newStartTime = now - sessionTimer * 1000;
      setSessionStartTime(newStartTime);
      setIsTimerPaused(false);
    } else {
      setIsTimerPaused(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Fetch plan data
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const { data } = await api.workout.fetchWorkoutInstance(Number(planId));

        const planData = data as unknown as IPlanData;
        planData.groups.sort(
          (groupA: IExerciseGroup, groupB: IExerciseGroup) => groupA.groupNumber - groupB.groupNumber
        );
        setPlan(planData);

        setCurrentCycle(planData.trainingSession?.trainingWeek?.trainingCycle || -1);

        // Check if there's saved progress first
        const savedProgress = localStorage.getItem(`exerciseProgress_${planId}`);

        const initializeDefaultProgress = () => {
          const initialProgress: IExerciseProgressMap = {};
          planData.groups.forEach((group: IExerciseGroup) => {
            group.exercises.forEach((exercise: IExerciseInstance) => {
              const numSets = parseInt(exercise.sets as string) || group.set || 1;

              const exerciseData: IExerciseProgressEntry = {
                sets: Array.from({ length: numSets }).map(() => ({
                  repetitions: exercise.repetitions || null,
                  weight: exercise.weight || null,
                  time: exercise.time || null,
                  distance: exercise.distance || null,
                  tempo: exercise.tempo || null,
                  notes: exercise.notes || null,
                  difficulty: exercise.difficulty || null,
                  duration: exercise.duration || null,
                  restInterval: exercise.restInterval || null,
                  completed: null,
                  rating: null
                })),
                completed: null,
                comments: ''
              };

              initialProgress[exercise.id] = exerciseData;
            });
          });

          setExerciseProgress(initialProgress);
        };

        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);

            if (!parsed || typeof parsed !== 'object') {
              throw new Error('Datos guardados inválidos');
            }

            const normalized: IExerciseProgressMap = {};
            Object.entries(parsed).forEach(([exerciseId, prog]: [string, any]) => {
              if (!prog || typeof prog !== 'object') {
                return;
              }

              let setsArray: any[] = [];
              if (Array.isArray(prog.sets)) {
                setsArray = prog.sets;
              } else if (prog.sets && typeof prog.sets === 'object') {
                setsArray = Object.values(prog.sets);
              }

              const validSets: ISetProgress[] = setsArray.map((set: any) => ({
                repetitions: set?.repetitions || null,
                weight: set?.weight || null,
                time: set?.time || null,
                distance: set?.distance || null,
                tempo: set?.tempo || null,
                notes: set?.notes || null,
                difficulty: set?.difficulty || null,
                duration: set?.duration || null,
                restInterval: set?.restInterval || null,
                completed: set?.completed === true ? true : set?.completed === false ? false : null,
                rating: set?.rating || null
              }));

              normalized[exerciseId] = {
                sets: validSets,
                completed: prog.completed === true ? true : prog.completed === false ? false : null,
                comments: prog.comments || ''
              };
            });

            setExerciseProgress(normalized);
          } catch (error) {
            console.error('Error al cargar progreso guardado:', error);
            initializeDefaultProgress();
          }
        } else {
          initializeDefaultProgress();
        }
      } catch (error: any) {
        console.error('Error al cargar plan:', error);
        showToast('error', 'Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, showToast, setLoading, setPlanDetailsVisible]); // eslint-disable-line

  // Session timer initialization
  useEffect(() => {
    const savedSessionData = localStorage.getItem(`sessionTimer_${planId}`);
    const now = Date.now();

    if (savedSessionData) {
      try {
        const { startTime, elapsedSeconds } = JSON.parse(savedSessionData);
        const totalElapsed = elapsedSeconds + Math.floor((now - startTime) / 1000);
        setSessionStartTime(startTime);
        setSessionTimer(totalElapsed);
      } catch (_error) {
        initializeNewTimer();
      }
    } else {
      initializeNewTimer();
    }

    function initializeNewTimer() {
      setSessionStartTime(now);
      setSessionTimer(0);

      const sessionData = {
        startTime: now,
        elapsedSeconds: 0
      };
      localStorage.setItem(`sessionTimer_${planId}`, JSON.stringify(sessionData));
    }
  }, [planId]); // eslint-disable-line

  // Timer tick every second
  useEffect(() => {
    if (!sessionStartTime || isTimerPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStartTime) / 1000);
      setSessionTimer(elapsed);

      if (elapsed % 10 === 0) {
        const sessionData = {
          startTime: sessionStartTime,
          elapsedSeconds: elapsed
        };
        localStorage.setItem(`sessionTimer_${planId}`, JSON.stringify(sessionData));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionStartTime, planId, isTimerPaused]); // eslint-disable-line

  // Auto-save with debounce
  useEffect(() => {
    if (!plan || Object.keys(exerciseProgress).length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      try {
        const normalizedProgress = normalizeExerciseProgress(exerciseProgress);
        const progressToSave = JSON.stringify(normalizedProgress);
        localStorage.setItem(`exerciseProgress_${planId}`, progressToSave);
      } catch (error) {
        console.error('Error al guardar progreso automáticamente:', error);
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [exerciseProgress, planId, plan]); // eslint-disable-line

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleExerciseChange = (exerciseId: number, setIndex: number | null, field: string, value: any) => {
    setExerciseProgress((prevProgress) => {
      if (typeof setIndex === 'number') {
        const prev = prevProgress[exerciseId] || ({} as IExerciseProgressEntry);
        const prevSets = Array.isArray(prev.sets) ? prev.sets : [];
        const newSets = [...prevSets];

        newSets[setIndex] = {
          ...newSets[setIndex],
          [field]: value
        };

        const newProgress = {
          ...prevProgress,
          [exerciseId]: {
            ...prev,
            sets: newSets
          }
        };

        return newProgress;
      } else {
        const newProgress = {
          ...prevProgress,
          [exerciseId]: {
            ...prevProgress[exerciseId],
            [field]: value
          }
        };

        return newProgress;
      }
    });
  };

  const handleSetCompletedChange = (exerciseId: number, setIndex: number, completed: boolean) => {
    setExerciseProgress((prevProgress) => {
      const newProgress = { ...prevProgress };
      const group = plan?.groups.find((g) => g.exercises.some((ex) => ex.id === exerciseId));
      if (!group) {
        return newProgress;
      }
      const exercise = group.exercises.find((ex) => ex.id === exerciseId);
      if (!exercise) {
        return newProgress;
      }

      if (!newProgress[exerciseId]?.sets) {
        const numSets = parseInt(exercise.sets as string) || group.set;

        const initialSets: ISetProgress[] = Array.from({ length: numSets || 1 }).map(() => ({
          repetitions: exercise.repetitions || null,
          weight: exercise.weight || null,
          time: exercise.time || null,
          distance: exercise.distance || null,
          tempo: exercise.tempo || null,
          notes: exercise.notes || null,
          difficulty: exercise.difficulty || null,
          duration: exercise.duration || null,
          restInterval: exercise.restInterval || null,
          completed: exercise.completed ?? null,
          rating: null
        }));

        newProgress[exerciseId] = {
          ...newProgress[exerciseId],
          sets: initialSets,
          completed: newProgress[exerciseId]?.completed ?? null,
          comments: newProgress[exerciseId]?.comments ?? ''
        };
      }

      newProgress[exerciseId].sets[setIndex] = {
        ...newProgress[exerciseId].sets[setIndex],
        completed
      };

      const allSetsCompleted = Object.values(newProgress[exerciseId].sets).every((set) => set.completed);
      newProgress[exerciseId].completed = allSetsCompleted;

      return newProgress;
    });
  };

  const handleVideoClick = (url: string) => {
    try {
      const videoId = extractYouTubeVideoId(url);
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      setCurrentVideoUrl(embedUrl);
      setVideoDialogVisible(true);
    } catch (error: any) {
      showToast('error', 'Error', error.message);
    }
  };

  const handleSaveProgress = () => {
    try {
      if (!plan || Object.keys(exerciseProgress).length === 0) {
        showToast('warn', 'Advertencia', 'No hay progreso para guardar');
        return;
      }

      const normalizedProgress = normalizeExerciseProgress(exerciseProgress);
      const progressToSave = JSON.stringify(normalizedProgress);
      localStorage.setItem(`exerciseProgress_${planId}`, progressToSave);

      const saved = localStorage.getItem(`exerciseProgress_${planId}`);

      if (saved) {
        try {
          showToast('success', 'Exito', intl.formatMessage({ id: 'training.success.saved' }));
        } catch (parseError) {
          console.error('Error al parsear datos guardados:', parseError);
          throw new Error('Los datos guardados estan corruptos');
        }
      } else {
        throw new Error('El progreso no se guardo correctamente');
      }
    } catch (error: any) {
      console.error('Error al guardar progreso manualmente:', error);
      showToast('error', 'Error', `No se pudo guardar el progreso: ${error.message}`);

      try {
        localStorage.removeItem(`exerciseProgress_${planId}`);
      } catch (cleanupError) {
        console.error('Error al limpiar datos corruptos:', cleanupError);
      }
    }
  };

  const handleClearProgress = () => {
    try {
      localStorage.removeItem(`exerciseProgress_${planId}`);
      localStorage.removeItem(`sessionTimer_${planId}`);

      setExerciseProgress({});
      setSessionTimer(0);
      setSessionStartTime(Date.now());
      setIsTimerPaused(false);

      const sessionData = {
        startTime: Date.now(),
        elapsedSeconds: 0
      };
      localStorage.setItem(`sessionTimer_${planId}`, JSON.stringify(sessionData));

      showToast('success', 'Exito', 'Progreso y cronometro reiniciados correctamente');
    } catch (error) {
      console.error('Error al eliminar progreso:', error);
      showToast('error', 'Error', 'No se pudo eliminar el progreso');
    }
  };

  const handleSubmitFeedback = ({
    generalFeedback,
    energyLevel,
    mood,
    perceivedDifficulty,
    additionalNotes
  }: IFeedbackPayload) => {
    // Normalize any null completed to false before finishing
    const normalizedProgress: IExerciseProgressMap = {};
    Object.entries(exerciseProgress).forEach(([exerciseId, prog]) => {
      const sets = (prog.sets || []).map((s) => ({
        ...s,
        completed: s.completed == null ? false : s.completed,
        rating: s.rating
      }));
      normalizedProgress[exerciseId] = {
        ...prog,
        sets,
        completed: prog.completed == null ? false : prog.completed
      };
    });

    const exerciseFeedbackArray = Object.entries(normalizedProgress)
      .map(([exerciseId, progress]) => {
        const sets = progress.sets || [];
        const group = plan?.groups.find((g) => g.exercises.some((ex) => ex.id === parseInt(exerciseId)));
        if (!group) {
          showToast('error', 'Error', intl.formatMessage({ id: 'training.error.exerciseNotFound' }));
          return null;
        }
        group.exercises.find((ex) => ex.id === parseInt(exerciseId));

        return {
          exerciseId: parseInt(exerciseId),
          sets,
          completed: progress.completed,
          comments: progress.comments
        };
      })
      .filter((feedback) => feedback !== null);

    if (exerciseFeedbackArray.length === 0) {
      showToast('error', 'Error', intl.formatMessage({ id: 'training.error.noFeedback' }));
      return;
    }
    if (sessionTimer === 0) {
      showToast('error', 'Error', intl.formatMessage({ id: 'training.error.noSessionTime' }));
      return;
    }

    const body = {
      exerciseFeedbackArray,
      userId: user?.userId,
      sessionTime: formatSessionTime(sessionTimer),
      generalFeedback,
      energyLevel,
      mood,
      perceivedDifficulty,
      additionalNotes,
      isCoachFeedback: user?.userType === 'coach',
      providedBy: user?.userType === 'coach' ? coach?.id : client?.id
    };

    console.log(body);

    setLoading(true);
    api.workout
      .submitFeedback(Number(planId), body, client ? client.id : clientId)
      .then(() => {
        setExerciseProgress({});
        setSessionTimer(0);
        setSessionStartTime(null);
        setIsTimerPaused(false);

        localStorage.removeItem(`exerciseProgress_${planId}`);
        localStorage.removeItem(`sessionTimer_${planId}`);

        setFinishDialogVisible(false);
        if (setRefreshKey) {
          setRefreshKey((prev) => prev + 1);
        }
        showToast('success', 'Session finished!', 'Congratulations, you have finished your routine.');
        if (user?.userType === 'coach') {
          navigate(`/client-dashboard/${clientId}`);
        } else {
          navigate('/student');
        }
      })
      .catch((error: any) => {
        showToast('error', 'Error', error.message);
        setFinishDialogVisible(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // ---------------------------------------------------------------------------
  // Computed helpers
  // ---------------------------------------------------------------------------

  const getStatusIcon = (status: string | undefined): string => {
    switch (status) {
      case 'completed':
        return 'pi pi-check-circle text-green-500';
      case 'pending':
        return 'pi pi-clock text-yellow-500';
      case 'expired':
        return 'pi pi-exclamation-circle text-red-500';
      default:
        return 'pi pi-info-circle text-blue-500';
    }
  };

  const isExerciseCompleted = (exercise: IExerciseInstance): boolean => {
    const progress = exerciseProgress[exercise.id];
    if (!progress || !progress.sets) return false;

    const sets = progress.sets;

    const allSetsAreMarked = sets.every((set) => set.completed === true || set.completed === false);

    if (!allSetsAreMarked) {
      return false;
    }

    const completedSets = sets.filter((set) => set.completed === true);
    const allCompletedSetsHaveRpe = completedSets.every((set) => set.rating !== null && set.rating !== undefined);

    return allCompletedSetsHaveRpe;
  };

  const isGroupCompleted = (group: IExerciseGroup): boolean => {
    return group.exercises.every((exercise) => isExerciseCompleted(exercise));
  };

  const canNavigateToNextGroup = (): boolean => {
    if (!plan || currentGroupIndex >= plan.groups.length - 1) return false;

    const currentGroup = plan.groups[currentGroupIndex]!;
    return isGroupCompleted(currentGroup);
  };

  const navigateToNextGroup = () => {
    if (canNavigateToNextGroup()) {
      setCurrentGroupIndex((prev) => prev + 1);
    }
  };

  const navigateToPreviousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
    }
  };

  const navigateToGroup = (index: number) => {
    if (plan && (index < currentGroupIndex || isGroupCompleted(plan.groups[index]!))) {
      setCurrentGroupIndex(index);
    }
  };

  const handleToggleAll = (flag: boolean, exerciseId: number) => {
    setExerciseProgress((prevProgress) => {
      const newProgress = { ...prevProgress };

      const existing = newProgress[exerciseId] || { sets: [], completed: null, comments: '' };
      const originalSets = existing.sets || [];
      const sets = originalSets.map((s) => ({ ...s, completed: flag }));

      newProgress[exerciseId] = { ...existing, sets, completed: flag };

      return newProgress;
    });
  };

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    plan,
    planId,
    exerciseProgress,
    videoDialogVisible,
    currentVideoUrl,
    finishDialogVisible,
    currentCycle,
    currentGroupIndex,
    sessionTimer,
    isTimerPaused,
    propertyUnits,
    loading,
    clientId,
    client,

    // Setters
    setVideoDialogVisible,
    setFinishDialogVisible,

    // Handlers
    handleExerciseChange,
    handleSetCompletedChange,
    handleVideoClick,
    handleSaveProgress,
    handleClearProgress,
    handleSubmitFeedback,
    handleToggleTimer,
    handleToggleAll,

    // Navigation
    navigateToNextGroup,
    navigateToPreviousGroup,
    navigateToGroup,
    canNavigateToNextGroup,

    // Computed
    getStatusIcon,
    isExerciseCompleted,
    isGroupCompleted,
    formatSessionTime,

    // Intl
    intl
  };
};
