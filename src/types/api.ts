/**
 * Tipos para respuestas de API y requests
 */

// ==================== RESPUESTAS GENÉRICAS ====================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== AUTH ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    type: 'coach' | 'client';
    verified: boolean;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  lastName?: string;
  type: 'coach' | 'client';
}

export interface VerifyEmailRequest {
  token: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// ==================== WORKOUT TEMPLATES ====================

export interface CreateWorkoutTemplateRequest {
  planName: string;
  description?: string;
  coachId: number;
  groups: CreateWorkoutGroupRequest[];
}

export interface CreateWorkoutGroupRequest {
  name?: string;
  groupNumber: number;
  order: number;
  exercises: CreateExerciseInstanceRequest[];
}

export interface CreateExerciseInstanceRequest {
  exerciseId?: number;
  sets?: string;
  repetitions?: string;
  weight?: string;
  duration?: string;
  rest?: string;
  notes?: string;
  order: number;
  setConfiguration?: CreateSetConfigurationRequest[];
}

export interface CreateSetConfigurationRequest {
  setNumber: number;
  repetitions?: string;
  weight?: string;
  duration?: string;
  rest?: string;
  rpe?: string;
  notes?: string;
}

export interface UpdateWorkoutTemplateRequest extends Partial<CreateWorkoutTemplateRequest> {
  id: number;
}

// ==================== TRAINING CYCLES ====================

export interface CreateTrainingCycleRequest {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  coachId: number;
  clientId?: number;
  isTemplate: boolean;
  weeks?: CreateTrainingWeekRequest[];
}

export interface CreateTrainingWeekRequest {
  weekNumber: number;
  startDate: string;
  endDate: string;
  sessions?: CreateTrainingSessionRequest[];
}

export interface CreateTrainingSessionRequest {
  sessionDate: string;
  sessionTime?: string;
  trainingType?: 'presencial' | 'virtual' | 'autonomo';
  location?: string;
  contactMethod?: string;
  notes?: string;
}

export interface AssignWorkoutToCycleRequest {
  workoutTemplateIds: number[];
  days: number[];
}

export interface AssignCycleTemplateToClientRequest {
  cycleTemplateId: number;
  clientId: number;
  startDate: string;
}

// ==================== EXERCISES ====================

export interface CreateExerciseRequest {
  name: string;
  description?: string;
  videoUrl?: string;
  imageUrl?: string;
  muscleGroup?: string;
  equipment?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  coachId?: number;
  isPublic?: boolean;
}

export interface UpdateExerciseRequest extends Partial<CreateExerciseRequest> {
  id: number;
}

export interface VerifyExerciseChangesRequest {
  exerciseId: number;
  currentData: any;
  newData: any;
}

// ==================== CLIENTS ====================

export interface CreateClientRequest {
  email: string;
  name: string;
  lastName?: string;
  age?: number;
  weight?: number;
  height?: number;
  goal?: string;
  medicalConditions?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  id: number;
}

export interface AssignCoachToClientRequest {
  clientId: number;
  coachId: number;
}

// ==================== COACH ====================

export interface UpdateCoachProfileRequest {
  name?: string;
  lastName?: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  country?: string;
  city?: string;
  profileImage?: string;
}

export interface UpdateBankDataRequest {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
}

// ==================== RPE ====================

export interface CreateRpeMethodRequest {
  name: string;
  description?: string;
  scale: number;
  values: CreateRpeValueRequest[];
}

export interface CreateRpeValueRequest {
  value: number;
  label: string;
  description?: string;
}

export interface AssignRpeRequest {
  rpeMethodId: number;
  targetType: 'client' | 'plan' | 'cycle';
  targetId: number;
}

// ==================== FEEDBACK ====================

export interface SubmitFeedbackRequest {
  rating?: number;
  comment?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  completedExercises?: number;
  totalExercises?: number;
}

// ==================== EXCEL VIEW ====================

export interface ExcelViewRow {
  groupNumber: number;
  groupName?: string;
  exerciseName: string;
  sets?: string;
  repetitions?: string;
  weight?: string;
  duration?: string;
  rest?: string;
  notes?: string;
}

export interface ExcelViewRequest {
  cycleId: number;
  dayNumber: number;
}

export interface SaveWorkoutChangesRequest {
  workoutInstanceId: number;
  changes: ExcelViewRow[];
}

// ==================== STATISTICS ====================

export interface LastTimeTrainedResponse {
  clientId: number;
  clientName: string;
  lastTrainingDate: string;
  daysSinceLastTraining: number;
}

export interface TrainingFrequencyResponse {
  clientId: number;
  clientName: string;
  trainingsThisWeek: number;
  trainingsThisMonth: number;
  averagePerWeek: number;
}

export interface CycleProgressResponse {
  cycleId: number;
  cycleName: string;
  clientId: number;
  clientName: string;
  daysToFinish: number;
  completedSessions: number;
  totalSessions: number;
  progressPercentage: number;
}

// ==================== SUBSCRIPTIONS ====================

export interface CreateSubscriptionRequest {
  planId: number;
  clientId: number;
  startDate: string;
}

export interface ProcessPaymentRequest {
  amount: number;
  currency: string;
  paymentMethod: string;
  clientId: number;
  subscriptionId?: number;
}

// ==================== NOTIFICATIONS ====================

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId: number;
}

export interface MarkNotificationAsReadRequest {
  notificationId: number;
}


