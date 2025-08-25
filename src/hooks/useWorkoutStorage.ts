import { useLocalStorage } from './useLocalStorage';

export interface WorkoutProgress {
  [exerciseId: string]: {
    sets: Array<{
      reps: number;
      weight: number;
      rpe?: number;
      completed: boolean;
    }>;
    completed: boolean;
  };
}

export interface SessionTimer {
  startTime: number;
  currentTime: number;
  isRunning: boolean;
  totalDuration: number;
}

export function useWorkoutStorage(planId: string) {
  // Estado del progreso de ejercicios
  const [exerciseProgress, setExerciseProgress, removeExerciseProgress, isProgressLoading] =
    useLocalStorage<WorkoutProgress>(`exerciseProgress_${planId}`, {});

  // Estado del cronómetro de sesión
  const [sessionTimer, setSessionTimer, removeSessionTimer, isTimerLoading] = useLocalStorage<SessionTimer | null>(
    `sessionTimer_${planId}`,
    null
  );

  // Función para actualizar progreso de un ejercicio específico
  const updateExerciseProgress = (exerciseId: string, progress: WorkoutProgress[string]) => {
    setExerciseProgress((prev) => ({
      ...prev,
      [exerciseId]: progress
    }));
  };

  // Función para marcar un ejercicio como completado
  const markExerciseCompleted = (exerciseId: string, completed: boolean) => {
    setExerciseProgress((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        completed
      }
    }));
  };

  // Función para limpiar todo el progreso del workout
  const clearWorkoutProgress = () => {
    removeExerciseProgress();
    removeSessionTimer();
  };

  // Función para iniciar/actualizar el cronómetro
  const updateSessionTimer = (timer: SessionTimer) => {
    setSessionTimer(timer);
  };

  return {
    // Estados
    exerciseProgress,
    sessionTimer,
    isLoading: isProgressLoading || isTimerLoading,

    // Funciones
    updateExerciseProgress,
    markExerciseCompleted,
    clearWorkoutProgress,
    updateSessionTimer,
    setExerciseProgress,
    setSessionTimer
  };
}
