/* eslint-disable @typescript-eslint/no-explicit-any */
import { IRpeMethod } from 'types/rpe/rpe-method-assigned';
import { ApiResponse, BaseFilters, PaginatedResponse } from '../types/api';
import { IWorkoutInstance } from 'types/workout/workout-instance';
import {
  ICategory,
  IMovementPattern,
  IEquipment,
  IExercise,
  IMovementPlane,
  IMuscle,
  IUnilateralType,
  IVariant,
  IDifficultyLevel,
  IContractionType
} from 'types/workout/exercise';
import { IWorkoutTemplate } from 'types/workout/workout-template';
import { IUpsertWorkoutTemplatePayload } from 'types/workout/plan-state';
import { ITrainingCycle } from 'types/training-cycle/training-cycle';
import { IClient } from 'types/models';
import { ICoachPlan } from 'types/coach/coach-plan';
import { toQueryString } from 'utils/UtilFunctions';

// Base URL (CRA env var)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Obtiene el accessToken desde el storage (persistencia estilo zustand)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const authStorage = localStorage.getItem('token');
    if (!authStorage) return null;
    return authStorage || null;
  } catch (error) {
    console.warn('Error al obtener token:', error);
    return null;
  }
}

// Limpia auth y redirige según tipo de usuario
function clearAuthAndRedirect(): void {
  if (typeof window === 'undefined') return;
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      const userType = parsed?.state?.userType;
      localStorage.removeItem('auth-storage');
      if (userType === 'client') {
        window.location.href = '/cliente/login';
      } else {
        window.location.href = '/negocio/login';
      }
    } else {
      localStorage.removeItem('auth-storage');
      window.location.href = '/negocio/login';
    }
  } catch (error) {
    console.error('Error al limpiar autenticación:', error);
    localStorage.removeItem('auth-storage');
    window.location.href = '/negocio/login';
  }
}

// Refresca el token usando refreshToken guardado
async function refreshAuthToken(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;

    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return false;

    const parsed = JSON.parse(authStorage);
    const refreshToken = parsed?.state?.tokens?.refreshToken;
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) return false;
    const data = await response.json();

    if (data?.success) {
      const currentState = parsed.state;
      const newState = {
        ...currentState,
        tokens: data.data.tokens,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      };

      localStorage.setItem('auth-storage', JSON.stringify({ ...parsed, state: newState }));
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error al renovar token:', error);
    return false;
  }
}

// Helper genérico de fetch con manejo de auth/refresh
async function fetchAPI<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = getAuthToken();
  const isLoginEndpoint = endpoint.includes('/login') || endpoint.includes('/auth/');
  const isAdminEndpoint = endpoint.includes('/platform-admin/');
  const isFormData = options.body instanceof FormData;

  const baseHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(typeof window !== 'undefined' && localStorage.getItem('platform-admin-token') && isAdminEndpoint
      ? { Authorization: `Bearer ${localStorage.getItem('platform-admin-token') as string}` }
      : {}),
    'ngrok-skip-browser-warning': 'true'
  };

  const finalHeaders = { ...baseHeaders, ...(options.headers as Record<string, string> | undefined) };
  const config: RequestInit = { ...options, headers: finalHeaders };

  try {
    const response = await fetch(url, config);

    if (response.status === 401 && token && !isLoginEndpoint) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        const newToken = getAuthToken();
        if (newToken && newToken !== token) {
          const retryHeaders: Record<string, string> = {
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            Authorization: `Bearer ${newToken}`,
            'ngrok-skip-browser-warning': 'true',
            ...(options.headers as Record<string, string> | undefined)
          };
          const newConfig: RequestInit = { ...options, headers: retryHeaders };
          const retryResponse = await fetch(url, newConfig);
          if (!retryResponse.ok) {
            try {
              const errorText = await retryResponse.text();
              console.error('📄 Error body:', errorText);
            } catch (e) {
              console.error('❌ No se pudo leer el error body:', e);
            }
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          return (await retryResponse.json()) as T;
        }
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        if (token && !isLoginEndpoint) {
          console.warn('🚪 Sesión expirada, redirigiendo al login...');
          clearAuthAndRedirect();
          throw new Error('Sesión expirada');
        }
      }

      try {
        const errorData = await response.json();
        if (errorData && !errorData.success && errorData.message) {
          const errorMessage =
            Array.isArray(errorData.errors) && errorData.errors.length > 0
              ? errorData.errors.join(', ')
              : errorData.message;
          throw new Error(errorMessage);
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch (jsonErr) {
        throw new Error((jsonErr as Error).message);
      }
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) throw error;
    throw new Error('Error de conexión. Verifica tu conexión a internet.');
  }
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, headers?: Record<string, string>) =>
    fetchAPI<ApiResponse<T>>(endpoint, { method: 'GET', headers }),

  post: <T = unknown>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    fetchAPI<ApiResponse<T>>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? (data as FormData) : data ? JSON.stringify(data) : undefined,
      headers
    }),

  put: <T = unknown>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    fetchAPI<ApiResponse<T>>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? (data as FormData) : data ? JSON.stringify(data) : undefined,
      headers
    }),

  patch: <T = unknown>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    fetchAPI<ApiResponse<T>>(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? (data as FormData) : data ? JSON.stringify(data) : undefined,
      headers
    }),

  delete: <T = unknown>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    fetchAPI<ApiResponse<T>>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
      headers
    }),

  authenticated: {
    get: <T = unknown>(endpoint: string, headers?: Record<string, string>) => apiClient.get<T>(endpoint, headers),
    post: <T = unknown>(endpoint: string, data?: Record<string, unknown>, headers?: Record<string, string>) =>
      apiClient.post<T>(endpoint, data, headers),
    put: <T = unknown>(endpoint: string, data?: Record<string, unknown>, headers?: Record<string, string>) =>
      apiClient.put<T>(endpoint, data, headers),
    delete: <T = unknown>(endpoint: string, headers?: Record<string, string>) => apiClient.delete<T>(endpoint, headers)
  }
};

// API agrupada por dominios/áreas
export const api = {
  auth: {
    login: (data: { email: string; password: string }) => apiClient.post<{ token: string }>('/auth', data),
    forgotPassword: (data: { email: string }) => apiClient.post<{ token: string }>('/auth/forgot-password', data),
    resetPassword: (data: { email: string; token: string; newPassword: string }) =>
      apiClient.post<{ token: string }>('/auth/reset-password', data),
    verifyPasswordResetCode: (data: { email: string; code: string }) =>
      apiClient.get(`/auth/verify-password-reset-code?email=${data.email}&code=${data.code}`)
  },
  coach: {
    fetchStudents: () => apiClient.get<IClient[]>(`/users/coach/allStudents`)
  },
  exercise: {
    processImportExercises: (importData: any) => apiClient.post<any>(`/exercise/process-import`, importData),
    fetchCoachExercises: (query: BaseFilters) =>
      apiClient.get<PaginatedResponse<IExercise>>(`/exercise${toQueryString(query as Record<string, unknown>)}`),
    fetchCategories: () => apiClient.get<ICategory[]>(`/exercise/categories`),
    fetchContractions: () => apiClient.get<IContractionType[]>(`/exercise/contractions`),
    fetchDifficulties: () => apiClient.get<IDifficultyLevel[]>(`/exercise/difficulties`),
    fetchEquipments: () => apiClient.get<IEquipment[]>(`/exercise/equipments`),
    fetchMovementPatterns: () => apiClient.get<IMovementPattern[]>(`/exercise/movement-patterns`),
    fetchMovementPlanes: () => apiClient.get<IMovementPlane[]>(`/exercise/movement-planes`),
    fetchMuscles: () => apiClient.get<IMuscle[]>(`/exercise/muscles`),
    fetchUnilateralTypes: () => apiClient.get<IUnilateralType[]>(`/exercise/unilateral-types`),
    fetchVariants: () => apiClient.get<IVariant[]>(`/exercise/variants`),
    createExercise: (data: {
      name: string;
      multimedia: string;
      categoryId?: number | null;
      variantId?: number | null;
      contractionTypeId?: number | null;
      difficultyLevelId?: number | null;
      movementPlaneId?: number | null;
      unilateralTypeId?: number | null;
      movementPatternId?: number | null;
      regressionExerciseId?: number | null;
      progressionExerciseId?: number | null;
      equipmentIds?: number[] | null;
      muscleIds?: number[] | null;
      createdByCoach: boolean;
      createdByAdmin: boolean;
    }) => apiClient.post<any>(`/exercise`, data),
    updateExercise: (
      exerciseId: number,
      data: {
        name: string;
        multimedia: string;
        categoryId?: number | null;
        variantId?: number | null;
        contractionTypeId?: number | null;
        difficultyLevelId?: number | null;
        movementPlaneId?: number | null;
        unilateralTypeId?: number | null;
        movementPatternId?: number | null;
        regressionExerciseId?: number | null;
        progressionExerciseId?: number | null;
        equipmentIds?: number[] | null;
        muscleIds?: number[] | null;
        createdByCoach: boolean;
        createdByAdmin: boolean;
      }
    ) => apiClient.put<any>(`/exercise/${exerciseId}`, data)
  },
  workout: {
    fetchWorkoutInstance: (planId: number) => apiClient.get<IWorkoutInstance>(`/workout/workout-instance/${planId}`),

    fetchWorkoutTemplate: (planId: number) => apiClient.get<IWorkoutTemplate>(`/workout/workout-template/id/${planId}`),
    fetchDeletedWorkoutTemplatesByCoachId: () => apiClient.get<IWorkoutTemplate[]>(`/workout/workout-template/deleted`),
    findAllWorkoutTemplatesByCoachId: () => apiClient.get<IWorkoutTemplate[]>(`/workout/workout-template`),

    fetchTrainingCyclesTemplatesByCoachId: () => apiClient.get<ITrainingCycle[]>(`/workout/training-cycle-templates`),

    fetchTrainingCycleTemplateById: (cycleId: number) =>
      apiClient.get<ITrainingCycle>(`/workout/training-cycle-templates/cycleId/${cycleId}`),
    fetchTrainingCyclesByClient: (clientId: number) =>
      apiClient.get<ITrainingCycle[]>(`/workout/training-cycles/client/clientId/${clientId}`),

    fetchTrainingSessionsWithoutWeekByClient: (clientId: number) =>
      apiClient.get<any[]>(`/workout/training-session-with-no-weeks/clientId/${clientId}`),

    createOrUpdateWorkoutTemplate: (data: IUpsertWorkoutTemplatePayload) =>
      apiClient.post<IWorkoutTemplate>(`/workout/template/create-or-update`, data),

    createOrUpdateWorkoutInstance: (data: IUpsertWorkoutTemplatePayload) =>
      apiClient.post<IWorkoutInstance>(`/workout/workout-instance/last-try`, data),

    deleteWorkoutPlan: (planId: number, isTemplate: boolean) =>
      apiClient.delete<any>(isTemplate ? `/workout/${planId}` : `/workout/deleteInstance/${planId}`),

    createTrainingCycleTemplate: (data: any) =>
      apiClient.post<ITrainingCycle>(`/workout/training-cycle-templates`, data),

    updateTrainingCycle: (cycleId: number, data: any) =>
      apiClient.put<ITrainingCycle>(`/workout/training-cycle-templates/cycleId/${cycleId}`, data),

    deleteTrainingCycleTemplate: (cycleId: number) =>
      apiClient.delete<any>(`/workout/training-cycle-templates/cycleId/${cycleId}`),

    assignCycleTemplateToClient: (data: {
      cycleTemplateId: number;
      clientId: number;
      startDate: string;
      endDate: string;
      rpeMethodId?: number;
    }) => apiClient.post<any>(`/workout/assign-cycle-template-to-client`, data),

    assignWorkoutToClient: (clientId: number, workoutIds: number[], rpeMethodId?: number) =>
      apiClient.post<any>(`/workout/assign-workout-to-client/${clientId}`, { workoutIds, rpeMethodId }),

    unassignWorkoutFromClient: (clientId: number, workoutIds: number[]) =>
      apiClient.delete<any>(`/workout/unassign-workout-from-client/${clientId}`, workoutIds)
  },
  trainingCycle: {
    fetchTrainingCycles: () => apiClient.get<ITrainingCycle[]>(`/workout/training-cycles`)
  },
  subscription: {
    fetchCoachSubscriptionPlans: () => apiClient.get<any[]>('/subscription/coach-subscription-plans'),
    fetchCoachPlans: () => apiClient.get<ICoachPlan[]>(`/users/coach/coachPlan`),
    createOrUpdateCoachPlan: (
      plan: { name: string; price: number; paymentFrequency: 'monthly' | 'weekly' | 'per_session'; coachId: number },
      planId: number | undefined,
      mode: 'create' | 'edit'
    ) => {
      const endpoint = mode === 'create' ? `/subscription/coach/coachPlan` : `/subscription/coach/coachPlan/${planId}`;
      const method = mode === 'create' ? apiClient.post : apiClient.put;
      return method<any>(endpoint, plan);
    },
    deleteCoachPlan: (planId: number) => apiClient.delete<any>(`/subscription/coach/coachPlan/${planId}`)
  },
  rpe: {
    getRpeMethodAssigned: (clientId: number, planId: number, cycleId: number) =>
      apiClient.get<IRpeMethod>(`/workout/rpe/get-by-client-id/${clientId}/${planId}/${cycleId}`),

    // RPE - Métodos y asignaciones (migrado desde services/workoutService.js)
    getRpeMethods: () => apiClient.get<any>(`/workout/rpe/all`),
    getRpeAssignments: () => apiClient.get<any>(`/workout/rpe/get-all-assignments`),
    createOrUpdateRpeMethod: (dialogMode: 'create' | 'edit', newRpe: any) => {
      const endpoint = dialogMode === 'create' ? `/workout/rpe/create` : `/workout/rpe/update/${newRpe.id}`;
      const method = dialogMode === 'create' ? apiClient.post : apiClient.put;
      return method<any>(endpoint, newRpe);
    },
    deleteRpe: (rpeId: number) => apiClient.delete<any>(`/workout/rpe/delete/${rpeId}`),
    assignRpeToTarget: (rpeMethodId: number, targetType: string, targetId: number, userId: number) =>
      apiClient.post<any>(`/workout/rpe/assign/${userId}`, { rpeMethodId, targetType, targetId }),
    removeRpeAssignment: (assignmentId: number, targetType: string, userId: number) =>
      apiClient.delete<any>(`/workout/rpe/remove-assignment/${assignmentId}/${targetType}/${userId}`)
  }
};

export type { ApiResponse };
