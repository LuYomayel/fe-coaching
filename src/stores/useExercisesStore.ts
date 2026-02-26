import { create } from 'zustand';
import { api } from '../services/api-client';
import { IExercise } from '../types/workout/exercise';

interface ExercisesState {
  exercises: IExercise[];
  isLoading: boolean;
  error: string | null;
  invalidated: boolean;
  loadExercises: (opts?: { search?: string; limit?: number }) => Promise<void>;
  invalidate: () => void;
  getExercisesForDropdown: () => Array<{ id: number; name: string }>;
}

export const useExercisesStore = create<ExercisesState>((set, get) => ({
  exercises: [],
  isLoading: false,
  error: null,
  invalidated: true,

  loadExercises: async (opts?: { search?: string; limit?: number }) => {
    const { invalidated, exercises, isLoading } = get();
    if (isLoading) return;
    // Usar caché si no está invalidado y tenemos datos (solo para carga inicial sin búsqueda)
    if (!invalidated && exercises.length > 0 && !opts?.search) return;

    set({ isLoading: true, error: null });
    try {
      const { data } = await api.exercise.fetchCoachExercises({
        search: opts?.search ?? '',
        limit: opts?.limit ?? undefined,
        page: 1
      });
      set({
        exercises: data?.items ?? [],
        isLoading: false,
        error: null,
        invalidated: false
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar ejercicios';
      setTimeout(() => {
        set({ isLoading: false, error: message });
      }, 10000);
    }
  },

  invalidate: () => set({ invalidated: true }),

  getExercisesForDropdown: () => {
    const { exercises } = get();
    return exercises.map((ex) => ({ id: ex.id, name: ex.name }));
  }
}));
