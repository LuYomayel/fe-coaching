import { IWorkoutInstanceTemplate } from './workout-instance-template';
import { IExerciseInstanceTemplate } from './exercise-instance-template';
export interface IExerciseGroupTemplate {
  id: number;
  workoutInstanceTemplate: IWorkoutInstanceTemplate;
  exercises: IExerciseInstanceTemplate[];
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
