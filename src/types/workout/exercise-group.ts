import { IWorkoutInstance } from './workout-instance';
import { IExerciseInstance } from './exercise-instance';

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
