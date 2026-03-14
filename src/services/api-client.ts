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
        console.log('errorData', errorData);
        if (errorData && !errorData.success && errorData.message) {
          const errorMessage =
            Array.isArray(errorData.errors) && errorData.errors.length > 0
              ? errorData.errors.join(', ')
              : errorData.error;

          throw new Error(errorMessage);
        }
        console.log('errorData.message', errorData.message);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } catch (jsonErr) {
        throw new Error((jsonErr as Error).message);
      }
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Error de conexión con el servidor:', error);
      throw new Error(
        'No se pudo conectar con el servidor. Verificá tu conexión a internet o intentá de nuevo en unos minutos.'
      );
    }
    console.error('Error:', error);
    if (error instanceof Error) throw error;
    throw new Error('Ocurrió un error inesperado. Intentá de nuevo.');
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
    login: (data: { email: string; password: string }) => apiClient.post<{ access_token: string }>('/auth/login', data),
    forgotPassword: (data: { email: string }) => apiClient.post<{ token: string }>('/auth/forgot-password', data),
    resetPassword: (data: { email: string; token: string; newPassword: string }) =>
      apiClient.post<{ token: string }>('/auth/reset-password', data),
    verifyPasswordResetCode: (data: { email: string; code: string }) =>
      apiClient.get(`/auth/verify-password-reset-code?email=${data.email}&code=${data.code}`),
    verifyEmail: (email: string, code: string) =>
      apiClient.get(`/auth/verify-email?email=${encodeURIComponent(email)}&code=${code}`),
    sendVerificationEmail: (email: string) => apiClient.post('/auth/send-verification-email', { email })
  },
  coach: {
    fetchStudents: () => apiClient.get<IClient[]>(`/users/coach/allStudents`),
    fetchClientsSubscribed: () => apiClient.get<any[]>(`/users/coach/clients-subscribed`)
  },
  user: {
    fetchUser: (userId: number) => apiClient.get<any>(`/users/${userId}`),
    fetchCoach: (userId: number) => apiClient.get<any>(`/users/coach/${userId}`),
    fetchClient: (userId: number) => apiClient.get<any>(`/users/client/${userId}`),
    fetchClientByClientId: (clientId: number) => apiClient.get<any>(`/users/client/clientId/${clientId}`),
    fetchMyClientProfile: () => apiClient.get<any>(`/users/client/me`),
    fetchClientActivitiesByUserId: (userId: number) => apiClient.get<any[]>(`/users/userId/activities/${userId}`),
    fetchMyActivities: () => apiClient.get<any[]>(`/users/my/activities`),
    saveStudent: (body: any) => apiClient.post<any>(`/users/client`, body),
    updateStudent: (studentId: number, body: any) => apiClient.put<any>(`/users/client/${studentId}`, body),
    updateCoach: (body: any) => apiClient.post<any>(`/users/coach`, body),
    updatePersonalInfo: (personalInfoId: number, body: any) =>
      apiClient.put<any>(`/users/client/${personalInfoId}`, body),
    updateClient: (clientId: number, body: any) => apiClient.put<any>(`/students/${clientId}`, body),
    deleteClient: (clientId: number) => apiClient.delete<any>(`/users/client/${clientId}`),
    fetchClientStreak: (clientId: number) => apiClient.get<any>(`/workout-streaks/client/${clientId}/active`),
    fetchMyStreak: () => apiClient.get<any>(`/workout-streaks/my/active`),
    fetchClientDailyStreak: (clientId: number) => apiClient.get<any>(`/workout-streaks/client/${clientId}/daily`),
    fetchAmIWorkingOutToday: (clientId: number) => apiClient.get<any>(`/workout/am-i-traning-today/${clientId}`),
    fetchAmITrainingToday: () => apiClient.get<any>(`/workout/am-i-training-today`),
    registerCoach: (body: any) => apiClient.post<any>(`/auth/register`, body)
  },
  message: {
    fetchMessages: (coachId: number, clientId: number, page: number) =>
      apiClient.get<any>(`/messages/${coachId}/${clientId}?page=${page}&limit=100`),
    markMessagesAsRead: (senderId: number, receiverId: number) =>
      apiClient.post<any>(`/messages/mark-as-read/conversation/${senderId}/${receiverId}`),
    fetchLastMessages: (coachId: number) => apiClient.get<any[]>(`/messages/coach/${coachId}/last-messages`),
    fetchUnreadMessages: (userId: number) => apiClient.get<any>(`/messages/get-unread-messages/${userId}`)
  },
  notification: {
    markNotificationAsRead: (notificationId: number) =>
      apiClient.put<any>(`/notifications/mark-as-read/${notificationId}`),
    getUserNotifications: (userId: number) => apiClient.get<any[]>(`/notifications/all/${userId}`)
  },
  payment: {
    createMercadoPagoPayment: (coachId: number, paymentData: any) =>
      apiClient.post<any>(`/payment/mercado-pago/create-payment/${coachId}`, paymentData),
    checkMercadoPagoPaymentStatus: (paymentId: string) =>
      apiClient.get<any>(`/payment/mercado-pago/status/${paymentId}`),
    notifyBankTransfer: (coachId: number, transferData: any) =>
      apiClient.post<any>(`/payment/bank-transfer/notify/${coachId}`, transferData),
    getCoachBankData: (coachId: number) => apiClient.get<any>(`/payment/coach-bank-data/${coachId}`),
    getMyCoachBankData: () => apiClient.get<any>(`/payment/coach-bank-data/my`),
    updateCoachBankData: (bankData: any) => apiClient.post<any>(`/payment/coach-bank-data`, bankData)
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
    fetchRpeMethods: () => apiClient.get<IRpeMethod[]>(`/exercise/rpe-methods`),
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
    ) => apiClient.put<any>(`/exercise/${exerciseId}`, data),
    fetchBodyAreas: () => apiClient.get<any[]>(`/exercise/body-area`),
    fetchExerciseTypes: () => apiClient.get<any[]>(`/exercise/exercise-types`),
    deleteExercise: (exerciseId: number) => apiClient.delete<any>(`/exercise/${exerciseId}`),
    massUpdateExercises: (exercises: any[]) => apiClient.put<any>(`/exercise/mass-update`, exercises),
    importExercises: (coachId: number, file: FormData) => apiClient.post<any>(`/exercise/import/${coachId}`, file),
    analyzeExcelFile: (coachId: number, file: FormData) =>
      apiClient.post<any>(`/exercise/analyze-import/${coachId}`, file),
    createExercises: (exercises: any[]) => apiClient.post<any>(`/exercise/generate-exercises`, exercises),
    deleteExercises: (exercises: any[]) => apiClient.post<any>(`/workout/delete-exercises`, exercises)
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
      apiClient.delete<any>(`/workout/unassign-workout-from-client/${clientId}`, workoutIds),

    // Workout instance templates
    fetchWorkoutInstanceTemplate: (templateId: number) =>
      apiClient.get<any>(`/workout/workout-instance-template/${templateId}`),

    // Client workouts
    fetchWorkoutsByClientId: (clientId: number) => apiClient.get<any[]>(`/workout/client/${clientId}`),
    fetchMyTrainingCycles: () => apiClient.get<any[]>(`/workout/training-cycles/client/userId`),
    fetchTrainingSessionWithNoWeekByClientId: (clientId: number) =>
      apiClient.get<any[]>(`/workout/training-session-with-no-weeks/clientId/${clientId}`),
    fetchMyTrainingSessionWithNoWeek: () => apiClient.get<any[]>(`/workout/training-session-with-no-weeks/my`),

    // Excel view
    fetchAssignedWorkoutsForCycleDay: (cycleId: number, dayNumber: number) =>
      apiClient.get<any>(`/workout/training-cycle/${cycleId}/day/${dayNumber}`),
    fetchExcelViewByCycleAndDay: (cycleId: number, dayNumber: number) =>
      apiClient.get<any>(`/workout/excel-view/${cycleId}/day/${dayNumber}`),
    saveWorkoutChanges: (payload: any) => apiClient.post<any>(`/workout/save-changes-from-excel-view`, payload),
    createNewTrainingFromExcelView: (plan: any) => apiClient.post<any>(`/workout/from-excel-view`, plan),

    // Coach dashboard stats
    fetchLastTimeTrained: () => apiClient.get<any>(`/workout/last-time-trained`),
    fetchHowLongToFinishCycle: () => apiClient.get<any>(`/workout/how-long-to-finish-cycle`),
    fetchTrainingFrequency: () => apiClient.get<any>(`/workout/training-frequency`),

    // Training cycles (non-template)
    createTrainingCycle: (body: any) => apiClient.post<any>(`/workout/training-cycles`, body),
    deleteTrainingCycle: (cycleId: number, forceDelete?: boolean) =>
      apiClient.delete<any>(`/workout/training-cycle/cycleId/${cycleId}?forceDelete=${forceDelete || false}`),
    verifyTrainingCycleDeletion: (cycleId: number) =>
      apiClient.get<any>(`/workout/training-cycle/cycleId/${cycleId}/verify-deletion`),

    // Plan submission
    submitPlan: (plan: any, planId: number | null, isEdit: boolean, isTemplate: boolean) => {
      if (!isEdit) return apiClient.post<any>(`/workout`, plan);
      const type = isTemplate ? 'template' : 'instance';
      return apiClient.put<any>(`/workout/${type}/${planId}`, plan);
    },
    submitPlanTemplate: (plan: any) => apiClient.post<any>(`/workout/workout-template/last-try`, plan),
    updatePlanName: (planId: number, planName: string) =>
      apiClient.put<any>(`/workout/update-name/${planId}`, { planName }),

    // Exercise operations
    updateExercisesInstance: (exercises: any) => apiClient.post<any>(`/workout/updateExercises`, exercises),
    verifyExerciseChanges: (exerciseData: any) => apiClient.post<any>(`/workout/verify-exercise-changes`, exerciseData),

    // Assignments
    assignWorkout: (data: any) => apiClient.post<any>(`/workout/assignWorkout`, data),
    assignWorkoutsToCycle: (cycleId: number, clientId: number, body: any) =>
      apiClient.post<any>(`/workout/assign-cycle/${cycleId}/assign-workouts/${clientId}`, body),
    createCycleAndAssignWorkouts: (body: any) =>
      apiClient.post<any>(`/workout/create-cycle-and-assign-workouts/${body.clientId}`, body),
    assignSession: (sessionId: number, body: any) => apiClient.post<any>(`/workout/assign-session/${sessionId}`, body),
    assignTrainingSessionToClient: (body: any) =>
      apiClient.post<any>(`/workout/assign-training-session-to-client`, body),
    createAndAssignWorkout: (body: any) => apiClient.post<any>(`/workout/create-workout-and-assign`, body),
    unassignWorkoutsFromCycle: (cycleId: number, body: any) =>
      apiClient.delete<any>(`/workout/delete-instances-cycle/${cycleId}`, body),

    // Delete instance
    deletePlan: (workoutInstanceId: number) => apiClient.delete<any>(`/workout/deleteInstance/${workoutInstanceId}`),

    // Feedback
    submitFeedback: (planId: number, body: any, clientId: number) =>
      apiClient.post<any>(`/workout/feedback/${planId}/clientId/${clientId}`, body),
    submitMyFeedback: (planId: number, body: any) => apiClient.post<any>(`/workout/feedback/${planId}/my`, body),

    // Session details
    updateWorkoutInstance: (workoutInstanceId: number, body: any) =>
      apiClient.put<any>(`/workout/session-details/${workoutInstanceId}`, body)
  },
  trainingCycle: {
    fetchTrainingCycles: () => apiClient.get<ITrainingCycle[]>(`/workout/training-cycles`)
  },
  subscription: {
    fetchCoachSubscriptionPlans: () => apiClient.get<any[]>('/subscription/coach-subscription-plans'),
    fetchCoachPlans: () => apiClient.get<ICoachPlan[]>(`/users/coach/coachPlan`),
    createOrUpdateCoachPlan: (
      plan: { name: string; price: number; paymentFrequency: 'monthly' | 'weekly' | 'per_session' },
      planId: number | undefined,
      mode: 'create' | 'edit'
    ) => {
      const endpoint = mode === 'create' ? `/subscription/coach/coachPlan` : `/subscription/coach/coachPlan/${planId}`;
      const method = mode === 'create' ? apiClient.post : apiClient.put;
      return method<any>(endpoint, plan);
    },
    deleteCoachPlan: (planId: number) => apiClient.delete<any>(`/subscription/coach/coachPlan/${planId}`),
    fetchCoachSubscription: (coachId: number) => apiClient.get<any>(`/subscription/coach/${coachId}`),
    fetchSubscriptionForStudent: (studentId: number) => apiClient.get<any>(`/subscription/client/${studentId}`),
    fetchSubscriptionDetails: (userId: number) =>
      apiClient.get<any>(`/subscription/client-subscription/details/${userId}`),
    fetchMySubscriptionDetails: () => apiClient.get<any>(`/subscription/client-subscription/my/details`),
    assignSubscription: (body: any) => apiClient.post<any>(`/subscription/client`, body),
    makePayment: (body: any) => apiClient.post<any>(`/payment/create-payment-intent`, body),
    updateCoachSubscription: (body: any) => apiClient.put<any>(`/subscription/coach-subscription`, body),
    registerPayment: (body: any) => apiClient.put<any>(`/subscription/update`, body),
    cancelSubscription: (clientSubscriptionId: number) =>
      apiClient.delete<any>(`/subscription/clientSubscription/${clientSubscriptionId}`),
    fetchClientsPaymentStatus: () => apiClient.get<any>(`/subscription/clients-payment-status`)
  },
  rpe: {
    getRpeMethodAssigned: (clientId: number, planId: number, cycleId: number) =>
      apiClient.get<IRpeMethod>(`/workout/rpe/get-by-client-id/${clientId}/${planId}/${cycleId}`),
    getMyRpeMethod: (planId: number, cycleId: number) =>
      apiClient.get<IRpeMethod>(`/workout/rpe/my/${planId}/${cycleId}`),

    // RPE - Métodos y asignaciones (migrado desde services/workoutService.js)
    getRpeMethods: () => apiClient.get<any>(`/workout/rpe/all`),
    getRpeAssignments: () => apiClient.get<any>(`/workout/rpe/get-all-assignments`),
    createOrUpdateRpeMethod: (dialogMode: 'create' | 'edit', newRpe: any) => {
      const endpoint = dialogMode === 'create' ? `/workout/rpe/create` : `/workout/rpe/update/${newRpe.id}`;
      const method = dialogMode === 'create' ? apiClient.post : apiClient.put;
      return method<any>(endpoint, newRpe);
    },
    setDefault: (rpeId: number) => apiClient.put<any>(`/workout/rpe/update/${rpeId}`, { isDefault: true }),
    deleteRpe: (rpeId: number) => apiClient.delete<any>(`/workout/rpe/delete/${rpeId}`),
    assignRpeToTarget: (rpeMethodId: number, targetType: string, targetId: number) =>
      apiClient.post<any>(`/workout/rpe/assign`, { rpeMethodId, targetType, targetId }),
    removeRpeAssignment: (assignmentId: number, targetType: string) =>
      apiClient.delete<any>(`/workout/rpe/remove-assignment/${assignmentId}/${targetType}`)
  }
};

export type { ApiResponse };
