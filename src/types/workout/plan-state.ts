/**
 * Tipos para el estado local del plan en el editor
 * Estos tipos extienden los tipos de workout pero incluyen propiedades
 * adicionales necesarias para la interfaz de usuario (drag&drop, etc)
 */

import { IExercise } from './exercise';
import { IExerciseInstanceTemplate } from './exercise-instance-template';

/**
 * Configuración de un set individual en el editor
 */
export interface ISetConfiguration {
  setNumber?: number;
  repetitions?: string;
  weight?: string;
  time?: string;
  restInterval?: string;
  tempo?: string;
  notes?: string;
  difficulty?: string;
  duration?: string;
  distance?: string;
}

/**
 * Ejercicio en el estado local (con propiedades de UI)
 */
export interface IPlanExercise extends Omit<IExerciseInstanceTemplate, 'id' | 'group' | 'exercise'> {
  id: string | number; // puede ser uuid o número (si existe en BD)
  dragId?: string; // ID único para drag & drop
  exercise: {
    id: number | null;
    name: string;
  };
  rowIndex: number;
  rpe?: string;
  setConfiguration?: ISetConfiguration[] | null;
}

/**
 * Grupo en el estado local (con propiedades de UI)
 */
export interface IPlanGroup {
  id: string | number; // puede ser uuid o número (si existe en BD)
  groupNumber: number;
  name?: string;
  set?: string | number;
  rest?: string | number;
  isRestPeriod?: boolean;
  restDuration?: number | null;
  exercises: IPlanExercise[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Información del plan/workout en el estado local
 */
export interface IPlanInfo {
  planName: string;
  workoutId: number | null;
  workoutInstanceTemplateId: number | null;
  instanceName: string;
  clientFacingName: string;
  personalizedNotes: string;
}

/**
 * Payload para crear/actualizar workout template
 */
export interface IUpsertWorkoutTemplatePayload {
  workout: {
    id?: number;
    planName: string;
    coach?: {
      id: number;
    };
    workoutInstanceTemplates?: Array<{
      id: number;
    }>;
  };
  instanceName: string;
  clientFacingName: string;
  personalizedNotes: string;
  groups: Array<{
    groupNumber: number;
    name?: string;
    set?: string | number | null;
    rest?: string | number | null;
    isRestPeriod: boolean;
    restDuration?: number | null;
    exercises: Array<{
      id?: number;
      rowIndex: number;
      exercise: {
        id: number;
        name: string;
      };
      repetitions?: string | null;
      sets?: string | null;
      time?: string | null;
      weight?: string | null;
      restInterval?: string | null;
      tempo?: string | null;
      notes?: string | null;
      difficulty?: string | null;
      duration?: string | null;
      distance?: string | null;
      setConfiguration?: ISetConfiguration[] | null;
    }>;
  }>;
  isTemplate: boolean;
  coachId?: number;
}

/**
 * Respuesta del servidor al crear/actualizar workout template
 */
export interface IWorkoutTemplateResponse {
  id: number;
  planName: string;
  workoutInstanceTemplates?: Array<{
    id: number;
    instanceName?: string;
    clientFacingName?: string;
    personalizedNotes?: string;
    groups?: Array<{
      id: number;
      groupNumber: number;
      name?: string;
      set?: number;
      rest?: number;
      isRestPeriod?: boolean;
      restDuration?: number;
      exercises?: Array<{
        id: number;
        rowIndex: number;
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
        setConfiguration?: ISetConfiguration[];
      }>;
    }>;
  }>;
}
