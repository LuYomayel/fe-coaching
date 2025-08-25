// =============================================
// SHARED TYPES FOR TRAINEASE BACKEND & FRONTEND
// =============================================
// Este archivo contiene todas las interfaces, enums y DTOs
// del backend para ser compartidas con el frontend Next.js

import { JwtPayload } from 'jwt-decode';
import { ColorPickerHSBType, ColorPickerRGBType } from 'primereact/colorpicker';
import { ReactNode } from 'react';

// =============================================
// ENUMS
// =============================================

export enum EUserType {
  COACH = 'coach',
  CLIENT = 'client'
}

export enum UserRole {
  ADMIN = 'admin',
  COACH = 'coach',
  CLIENT = 'client'
}

export enum ETrainingType {
  PRESENCIAL = 'presencial',
  VIRTUAL_SINCRONICO = 'virtual_sincronico',
  VIRTUAL_ASINCRONICO = 'virtual_asincronico',
  HIBRIDO = 'hibrido'
}

export enum EActivityLevel {
  SEDENTARY = 'sedentary',
  MODERATELY_ACTIVE = 'moderately active',
  VERY_ACTIVE = 'very active',
  EMPTY = ''
}

export enum EGender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  EMPTY = ''
}

export enum EStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  EXPIRED = 'Expired'
}

export enum WorkoutStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  IN_PROGRESS = 'in-progress'
}

export enum NotificationType {
  NEW_MESSAGE = 'NEW_MESSAGE',
  WORKOUT_UPDATE = 'WORKOUT_UPDATE',
  SUBSCRIPTION_EXPIRY = 'SUBSCRIPTION_EXPIRY'
}

export enum StreakType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  MERCADO_PAGO = 'MERCADO_PAGO'
}

// =============================================
// CONTEXT TYPES
// =============================================

export interface UserContextType {
  user: ICustomJwtPayload | null;
  coach: ICoach | null;
  client: IClient | null;
  setUser: (user: ICustomJwtPayload | null) => void;
  setCoach: (coach: ICoach | null) => void;
  setClient: (client: IClient | null) => void;
  isInitialized: boolean;
  isLoading?: boolean;
}

export interface UserProviderProps {
  children: ReactNode;
}

// =============================================
// BASE INTERFACES
// =============================================

export interface BaseEntity {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// =============================================
// PAYLOAD INTERFACES
// =============================================

export interface ICustomJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  userType: EUserType;
  isVerified: boolean;
  name: string;
}

// =============================================
// USER INTERFACES
// =============================================

export interface IUser {
  id: number;
  email: string;
  password: string;
  userType: EUserType;
  isVerified: boolean;
  coach?: ICoach;
  client?: IClient;
  reviews: IReview[];
  clientSubscriptions: IClientSubscription[];
  coachSubscriptions: ICoachSubscription[];
  subscription: ISubscription;
  rpeAssignments: IRpeAssignment[];
  rpeMethods: IRpeMethod[];
  notifications: INotification[];
  sentNotifications: INotification[];
  role: UserRole;
  activities?: IClientActivity[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ICoach {
  id: number;
  user: IUser;
  name: string;
  bio: string;
  experience: string;
  estimatedClients: number;
  trainingType: ETrainingType[];
  hasGym: boolean;
  gymLocation?: string;
  clients: IClient[];
  exercises: IExercise[];
  trainingCycles: ITrainingCycle[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IClient {
  id: number;
  user: IUser;
  coach: ICoach;
  name: string;
  birthdate?: Date;
  gender?: string;
  height?: number;
  weight?: number;
  fitnessGoal?: string;
  activityLevel?: EActivityLevel;
  phoneNumber?: string;
  trainingType?: ETrainingType;
  location?: string;
  contactMethod?: string;
  trainingCycles: ITrainingCycle[];
  workoutStreaks: IWorkoutStreak[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IClientActivity {
  id: number;
  user: IUser;
}

// =============================================
// EXERCISE INTERFACES
// =============================================

export interface IExercise {
  id: number;
  name: string;
  description?: string;
  multimedia?: string;
  equipmentNeeded?: string;
  bodyAreas?: IBodyArea[];
  exerciseBodyAreas?: IExerciseBodyArea;
  createdByCoach?: boolean;
  createdByAdmin?: boolean;
  coach?: ICoach;
  exerciseType?: IExerciseType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IExerciseInstance {
  id: number;
  exercise: IExercise;
  group: IExerciseGroup;
  repetitions?: string;
  sets?: string;
  time?: string;
  weight?: string;
  restInterval?: string;
  tempo?: string;
  notes?: string;
  difficulty?: string;
  duration?: string;
  distance?: string;
  setLogs?: IExerciseSetLog[];
  rowIndex?: number;
  completed?: boolean;
  completedNotAsPlanned: boolean;
  comments?: string;
  rpe?: string;
}

export interface IExerciseGroup {
  id: number;
  workoutInstance: IWorkoutInstance;
  exercises: IExerciseInstance[];
  set?: number;
  rest?: number;
  groupNumber: number;
  name?: string;
  isRestPeriod?: boolean;
  restDuration?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IExerciseSetLog {
  id: number;
  workoutInstance: IWorkoutInstance;
  exerciseId: number;
  setNumber: number;
  repetitions?: string;
  weight?: string;
  time?: string;
  distance?: string;
  tempo?: string;
  notes?: string;
  difficulty?: string;
  duration?: string;
  restInterval?: string;
  rating?: string;
  comments?: string;
  completed?: boolean;
}

export interface IBodyArea {
  id: number;
  name: string;
  exercises: IExercise[];
  exerciseBodyAreas: IExerciseBodyArea;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IExerciseBodyArea {
  id: number;
  exercise: IExercise;
  bodyArea: IBodyArea;
}

export interface IExerciseType {
  id: number;
  name: string;
  exercise: IExercise;
}

// =============================================
// WORKOUT INTERFACES
// =============================================

export interface IWorkout {
  id: number;
  coach: ICoach;
  planName: string;
  workoutInstances: IWorkoutInstance[];
  workoutTemplate: IWorkoutTemplate;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IWorkoutInstance {
  id: number;
  workout: IWorkout;
  clientSubscription?: IClientSubscription;
  instanceName: string;
  personalizedNotes?: string;
  status?: string;
  groups: IExerciseGroup[];
  trainingSession?: ITrainingSession;
  setLogs?: IExerciseSetLog[];
  expectedEndDate?: Date;
  dateAssigned?: Date;
  feedback?: IWorkoutFeedback;
  trainingType?: ETrainingType;
  location?: string;
  contactMethod?: string;
  isTemplate?: boolean;
}

export interface IWorkoutTemplate {
  id: number;
  coach: ICoach;
  name: string;
  planName: string;
  description?: string;
  workouts: IWorkout[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IWorkoutInstanceTemplate {
  id: number;
  coach: ICoach;
  clientSubscription?: IClientSubscription;
  templateName: string;
  personalizedNotes?: string;
  groups: IExerciseGroup[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  workoutTemplate: IWorkoutTemplate;
  instanceName?: string;
  status?: string;
  trainingSession?: ITrainingSession;
  feedback?: IWorkoutFeedback;
  isTemplate?: boolean;
}

/*
export interface IWorkoutFeedback {
  id: number;
  workoutInstance: IWorkoutInstance;
  rating?: number;
  comments?: string;
  difficulty?: string;
  duration?: number;
  fatigue?: string;
  motivation?: string;
  enjoyment?: string;
  perceivedExertion?: string;
  bodyPartsFocused?: string[];
  improvements?: string;
  challenges?: string;
  overallSatisfaction?: string;
  recommendToOthers?: boolean;
  additionalComments?: string;
  createdAt: Date;
  updatedAt: Date;
}
*/

export interface IWorkoutFeedback {
  id: number;
  workoutInstance: IWorkoutInstance;
  generalFeedback?: string;
  energyLevel?: number;
  mood?: number;
  perceivedDifficulty?: number;
  additionalNotes?: string;
  sessionTime?: string;
  realEndDate?: Date;
  feedback?: string;
  dateSubmitted?: Date;
  providedBy?: IUser;
  isCoachFeedback?: boolean;
}

export interface IWorkoutStreak {
  id: number;
  client: IClient;
  type: StreakType;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Date;
  streakStartDate: Date;
  streakEndDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClientWorkout {
  id: number;
  client: IClient;
  workout: IWorkout;
  clientSubscription: IClientSubscription;
  assignedDate: Date;
  completedDate?: Date;
  status: string;
}

// =============================================
// TRAINING CYCLE INTERFACES
// =============================================

export interface ITrainingCycle {
  id: number;
  coach: ICoach;
  client: IClient;
  cycleName: string;
  startDate: Date;
  endDate: Date;
  trainingWeeks: ITrainingWeek[];
}

export interface ITrainingWeek {
  id: number;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  trainingCycle: ITrainingCycle;
  trainingSessions: ITrainingSession[];
  trainingCycleTemplate?: ITrainingCycleTemplate;
}

export interface ITrainingSession {
  id: number;
  sessionDate: Date;
  dayNumber: number;
  trainingWeek?: ITrainingWeek;
  workoutInstances: IWorkoutInstance[];
  workout: IWorkout;
  client: IClient;
  trainingType?: ETrainingType;
  sessionTime?: string;
  location?: string;
  contactMethod?: string;
  notes?: string;
  status: string;
}

export interface ITrainingCycleTemplate {
  id: number;
  duration: number;
  isDurationInMonths: boolean;
  name: string;
  trainingWeeks: ITrainingWeek[];
}

// =============================================
// SUBSCRIPTION INTERFACES
// =============================================

export interface ISubscription {
  id: number;
  user: IUser;
  mealPlans?: IMealPlan[];
  schedules?: ISchedule[];
  startDate?: Date;
  endDate?: Date;
  status: EStatus;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  payments?: IPayment[];
  isDeleted: boolean;
  coachSubscription?: ICoachSubscription;
  clientSubscription?: IClientSubscription;
}

export interface IClientSubscription {
  id: number;
  subscription: ISubscription;
  client: IClient;
  coachPlan: ICoachPlan;
  workoutInstances: IWorkoutInstance[];
  workoutInstanceTemplates: IWorkoutInstanceTemplate[];
  clientWorkouts: IClientWorkout[];
}

export interface ICoachSubscription {
  id: number;
  subscription: ISubscription;
  coach: ICoach;
  subscriptionPlan: ISubcriptionPlan;
}

export interface ISubcriptionPlan {
  id: number;
  name: string;
  max_clients: number;
  price: number;
  coachSubscriptions?: ICoachSubscription[];
}

export interface ICoachPlan extends BaseEntity {
  id: number;
  coach: ICoach;
  name: string;
  price: number;
  workoutsPerWeek: number;
  includeMealPlan: boolean;
}

// =============================================
// RPE INTERFACES
// =============================================

export interface IRpeMethod {
  id: number;
  name: string;
  description?: string;
  createdBy: IUser;
  minValue: number;
  maxValue: number;
  step: number;
  valuesMeta: IRpeValueMeta[];
}

export interface IRpeValueMeta {
  id: number;
  rpeMethod: IRpeMethod;
  value: number;
  color: string | ColorPickerRGBType | ColorPickerHSBType;
  emoji: string;
}

export interface IRpeAssignment {
  id: number;
  assignedBy: IUser;
  client: IClient;
  rpeMethod: IRpeMethod;
  assignedDate: Date;
}

// =============================================
// NOTIFICATION INTERFACES
// =============================================

export interface INotification {
  id: number;
  message: string;
  type: NotificationType;
  referenceId?: number;
  user: IUser;
  fromUser: IUser;
  isRead: boolean;
  createdAt: Date;
}

// =============================================
// MESSAGE INTERFACES
// =============================================

export interface IMessage {
  id: number;
  sender: IUser;
  receiver: IUser;
  content: string;
  fileUrl?: string;
  fileType?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  timestamp: Date;
}

// =============================================
// PAYMENT INTERFACES
// =============================================

export interface IPayment {
  id: number;
  amount: number;
  date: Date;
  subscription: ISubscription;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoachBankData {
  id: number;
  coach: ICoach;
  paymentMethod: PaymentMethod;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  cbu?: string;
  alias?: string;
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// REVIEW INTERFACES
// =============================================

export interface IReview {
  id: number;
  rating: number;
  comment: string;
  coach: IUser;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================
// SCHEDULE INTERFACES
// =============================================

export interface ISchedule {
  id: number;
  dayOfWeek: string;
  time: string;
  subscription: ISubscription;
}

// =============================================
// MEAL PLAN INTERFACES
// =============================================

export interface IMealPlan {
  id: number;
  subscription: ISubscription;
  dayOfWeek: string;
  meals: string;
  foodItems: IFoodItem[];
}

export interface IFoodItem {
  id: number;
  name: string;
  calories: number;
  mealPlan: IMealPlan;
}

// =============================================
// DTOs - AUTH
// =============================================

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

// =============================================
// DTOs - USER
// =============================================

export interface CreateUserDTO {
  email: string;
  password: string;
  userType: EUserType;
  role?: UserRole;
}

export interface CreateCoachDTO {
  name: string;
  trainingType: ETrainingType[];
  subscriptionPlanId: number;
  estimatedClients: number;
  hasGym: boolean;
  gymLocation?: string;
  bio: string;
  experience: string;
  subscriptionPlan: ISubcriptionPlan;
}

export interface CreateClientDTO {
  email: string;
  name: string;
  fitnessGoal?: string[];
  activityLevel: EActivityLevel;
  birthdate?: Date;
  gender?: EGender;
  height?: number;
  weight?: number;
  coachId: number;
  trainingType?: ETrainingType;
  location?: string;
  contactMethod?: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  password?: string;
  isVerified?: boolean;
}

export interface UpdateClientDto {
  name?: string;
  birthdate?: Date;
  gender?: EGender;
  height?: number;
  weight?: number;
  fitnessGoal?: string[];
  activityLevel?: EActivityLevel;
  phoneNumber?: string;
  trainingType?: ETrainingType;
  location?: string;
  contactMethod?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// =============================================
// DTOs - EXERCISE
// =============================================

export interface CreateExerciseDto {
  name: string;
  description?: string;
  multimedia?: string;
  equipmentNeeded?: string;
}

export interface UpdateExerciseDto {
  name?: string;
  description?: string;
  multimedia?: string;
  equipmentNeeded?: string;
}

export interface UpdateExerciseArrayDto {
  exercises: UpdateExerciseDto[];
}

// =============================================
// DTOs - WORKOUT
// =============================================

export interface ExerciseSetLogDto {
  id: number;
  workoutInstance: IWorkoutInstance;
  exerciseInstance: IExerciseInstance;
  restInterval?: string;
  exerciseId: number;
  setNumber: number;
  repetitions: string;
  weight: string;
  time?: string;
  notes?: string;
  rpe?: number;
  tempo?: string;
  difficulty?: string;
  duration?: string;
  distance?: string;
}

export interface ExerciseInstanceDto {
  id?: number;
  group: IExerciseGroup;
  exercise: IExercise;
  repetitions?: string;
  sets?: string;
  time?: string;
  weight?: string;
  restInterval?: string;
  tempo?: string;
  notes?: string;
  difficulty?: string;
  duration?: string;
  distance?: string;
  completed?: boolean;
  completedNotAsPlanned?: boolean;
  rpe?: string;
  comments?: string;
  setLogs?: ExerciseSetLogDto[];
  rowIndex?: number;
}

export interface ExerciseGroupDto {
  id?: number;
  workoutInstance: IWorkoutInstance;
  set?: number;
  rest?: number;
  groupNumber: number;
  name?: string;
  exercises: ExerciseInstanceDto[];
  restDuration?: number | null;
  isRestPeriod?: boolean;
}

export interface CreateWorkoutDto {
  workout: IWorkout;
  isTemplate: boolean;
  feedback?: string;
  instanceName: string;
  personalizedNotes?: string;
  groups: ExerciseGroupDto[];
}

export interface AssignWorkoutDto {
  expectedEndDate: Date;
  notes: string;
  planId: number;
  studentId: number;
  status: string;
  instanceName: string;
}

export interface UpdateWorkoutDto {
  planName?: string;
  groups?: ExerciseGroupDto[];
  instanceName?: string;
  personalizedNotes?: string;
  feedback?: string;
  status?: string;
}

export interface CreateWorkoutInstanceDto {
  workoutId: number;
  clientSubscriptionId: number;
  instanceName: string;
  personalizedNotes?: string;
  groups?: ExerciseGroupDto[];
}

export interface UpdateWorkoutInstanceDto {
  instanceName?: string;
  personalizedNotes?: string;
  status?: string;
  groups?: ExerciseGroupDto[];
}

export interface CreateFeedbackDto {
  workoutInstanceId: number;
  rating?: number;
  comments?: string;
  difficulty?: string;
  duration?: number;
  fatigue?: string;
  motivation?: string;
  enjoyment?: string;
  perceivedExertion?: string;
  bodyPartsFocused?: string[];
  improvements?: string;
  challenges?: string;
  overallSatisfaction?: string;
  recommendToOthers?: boolean;
  additionalComments?: string;
  providedBy?: number;
  isCoachFeedback?: boolean;
}

export interface ExerciseFeedbackDto {
  exerciseId: number;
  sets: ExerciseSetLogDto[];
  completed: boolean;
  comments?: string;
  userId: number;
}

export interface WorkoutStreakDto {
  clientId: number;
  type: StreakType;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Date;
  isActive: boolean;
}

export interface ActiveStreaksDto {
  activeStreaks: WorkoutStreakDto[];
}

export interface StreakHistoryDto {
  streakHistory: WorkoutStreakDto[];
}

export interface CreateCycleDto {
  coachId: number;
  clientId: number;
  cycleName: string;
  startDate: Date;
  endDate: Date;
  trainingWeeks: ITrainingWeek[];
}

export interface AssignWorkoutsToCycleDTO {
  cycleId: number;
  workoutIds: number[];
}

export interface CreateRpeDto {
  name: string;
  description?: string;
  createdById: number;
}

export interface UpdateRpeDto {
  name?: string;
  description?: string;
}

export interface DeleteExercisesDto {
  exerciseIds: number[];
}

export interface VerifyExerciseChangesDto {
  exerciseId: number;
  hasActiveWorkouts: boolean;
  affectedWorkoutCount: number;
}

export interface VerifyDeletionDto {
  exerciseIds: number[];
}

export interface DeletionVerificationResponseDto {
  canDelete: boolean;
  warnings: string[];
  affectedWorkouts: number;
}

// =============================================
// DTOs - SUBSCRIPTION
// =============================================

export interface CreateSubscriptionDTO {
  userId: number;
}

export interface CreateCoachSubscriptionDTO {
  coachId: number;
  subscriptionId: number;
}

export interface CreateCoachPlanDTO {
  coachId: number;
  name: string;
  price: number;
  workoutsPerWeek: number;
  includeMealPlan: boolean;
}

export interface CreateClientSubscriptionDTO {
  coachPlanId: number;
  coachId: number;
  clientId: number;
  startDate: string;
  endDate: string;
  userId: number;
}

export interface UpdateSubscriptionDto {
  startDate?: Date;
  endDate?: Date;
  status?: EStatus;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  isDeleted?: boolean;
}

// =============================================
// DTOs - PAYMENT
// =============================================

export interface CreatePaymentDto {
  // Vacío en el backend actual
}

export interface UpdatePaymentDto {
  amount?: number;
  date?: Date;
}

export interface CreateCoachBankDataDto {
  coachId: number;
  paymentMethod: PaymentMethod;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  cbu?: string;
  alias?: string;
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoUserId?: string;
}

// =============================================
// DTOs - REVIEW
// =============================================

export interface CreateReviewDto {
  // Vacío en el backend actual
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

// =============================================
// DTOs - SCHEDULE
// =============================================

export interface CreateScheduleDto {
  // Vacío en el backend actual
}

export interface UpdateScheduleDto {
  dayOfWeek?: string;
  time?: string;
}

// =============================================
// DTOs - FOOD ITEM
// =============================================

export interface CreateFoodItemDto {
  // Vacío en el backend actual
}

export interface UpdateFoodItemDto {
  name?: string;
  calories?: number;
}

// =============================================
// DTOs - MEAL PLAN
// =============================================

export interface CreateMealPlanDto {
  // Vacío en el backend actual
}

export interface UpdateMealPlanDto {
  dayOfWeek?: string;
  meals?: string;
}

// =============================================
// DTOs - TRAINING CYCLE TEMPLATES
// =============================================

export interface CreateTrainingSessionTemplateDto {
  dayNumber: number;
  sessionTime?: string;
  workoutTemplateIds?: number[];
}

export interface CreateTrainingWeekTemplateDto {
  weekNumber: number;
  startDate?: Date;
  endDate?: Date;
  trainingSessions: CreateTrainingSessionTemplateDto[];
}

export interface CreateCycleTemplateDto {
  templateName: string;
  description?: string;
  durationWeeks: number;
  coachId: number;
  trainingWeeks: CreateTrainingWeekTemplateDto[];
}

export interface UpdateTrainingSessionTemplateDto {
  dayNumber?: number;
  sessionTime?: string;
  workoutTemplateIds?: number[];
}

export interface UpdateTrainingWeekTemplateDto {
  weekNumber?: number;
  startDate?: Date;
  endDate?: Date;
  trainingSessions?: UpdateTrainingSessionTemplateDto[];
}

export interface UpdateCycleTemplateDto {
  templateName?: string;
  description?: string;
  durationWeeks?: number;
  trainingWeeks?: UpdateTrainingWeekTemplateDto[];
}

export interface AssignCycleTemplateToClientDTO {
  templateId: number;
  clientId: number;
  startDate: Date;
}

export interface AssignTrainingSessionToClientDTO {
  sessionId: number;
  clientId: number;
  scheduledDate: Date;
  trainingType?: ETrainingType;
  location?: string;
  contactMethod?: string;
  notes?: string;
}

export interface AssignSessionDto {
  workoutInstanceId: number;
  sessionDate: Date;
  trainingType?: ETrainingType;
  sessionTime?: string;
  location?: string;
  contactMethod?: string;
  notes?: string;
}

export interface UpdateSessionDetailsDto {
  sessionDate?: Date;
  trainingType?: ETrainingType;
  sessionTime?: string;
  location?: string;
  contactMethod?: string;
  notes?: string;
  status?: string;
}

export interface CreateAndAssignWorkoutDTO {
  workoutData: CreateWorkoutDto;
  assignmentData: AssignWorkoutDto;
}

export interface UpdateExerciseInstanceDto {
  repetitions?: string;
  sets?: string;
  time?: string;
  weight?: string;
  restInterval?: string;
  tempo?: string;
  notes?: string;
  difficulty?: string;
  duration?: string;
  distance?: string;
  completed?: boolean;
  completedNotAsPlanned?: boolean;
  comments?: string;
  rpe?: string;
}

// =============================================
// SPECIALIZED DTOs
// =============================================

export interface WeeksDataDto {
  [weekNumber: number]: any;
}

export interface NewExerciseDto {
  exerciseId: number;
  groupNumber: number;
  position: number;
}

export interface MovedExerciseDto {
  exerciseInstanceId: number;
  fromGroupNumber: number;
  toGroupNumber: number;
  fromPosition: number;
  toPosition: number;
}

export interface MovedGroupDto {
  groupNumber: number;
  newPosition: number;
}

export interface UpdatedPropertyDto {
  exerciseInstanceId: number;
  property: string;
  newValue: string;
  weekNumber?: number;
}

export interface ChangesDto {
  newExercises: NewExerciseDto[];
  movedExercises: MovedExerciseDto[];
  movedGroups: MovedGroupDto[];
  updatedProperties: UpdatedPropertyDto[];
}

export interface SaveChangesFromExcelViewDto {
  workoutInstanceId: number;
  weeksData: WeeksDataDto;
  changes: ChangesDto;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================
// UPLOAD TYPES
// =============================================

export interface UploadResponse {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface IExcelExercise {
  name: string;
  row: number;
}

export interface IProcessImportExercisesResponse {
  registeredExercises: IExcelExercise[];
  updatedExercises: IExcelExercise[];
  missingExercises: IExcelExercise[];
}

// =============================================
// PROPERTY UNITS TYPES
// =============================================

export interface PropertyUnits {
  sets: string;
  repetitions: string;
  time: string;
  weight: string;
  restInterval: string;
  distance: string;
  height: string;
  tempo: string;
  difficulty: string;
  duration: string;
  notes: string;
  comments: string;
  rpe: string;
}

// =============================================
// COACH HOME PAGE TYPES
// =============================================

export interface LastTimeTrainedData {
  clientId: number;
  clientName: string;
  lastTimeTrained: string | null;
}

export interface HowLongToFinishCycleData {
  clientId: number;
  clientName: string;
  daysLeft?: number;
  timeToFinish?: string;
}

export interface TrainingFrequencyData {
  clientId: number;
  clientName: string;
  trainingSessionsLast7Days: number;
  trainingSessionsLast15Days: number;
  trainingSessionsLast30Days: number;
}

export interface PaymentStatusData {
  clientId: number;
  clientName: string;
  isPaid: boolean;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  status: string;
}

export interface CombinedClientData {
  clientId: number;
  clientName: string;
  lastTimeTrained: string | null;
  daysLeft: number | null;
  trainingSessionsLast30Days: number;
  trainingSessionsLast15Days: number;
  trainingSessionsLast7Days: number;
  isPaid: boolean;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  paymentStatus: string | null;
}

// =============================================
// CLIENT DASHBOARD TYPES
// =============================================

export interface CalendarEvents {
  events: CalendarEvent[];
  cycleOptions: ITrainingCycle[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  extendedProps?: {
    cycle?: string;
    sessionId?: number;
    contactMethod?: string;
    location?: string;
    notes?: string;
    sessionTime?: string;
    status?: string;
    trainingType?: ETrainingType;
    workoutInstanceId?: number;
  };
}
