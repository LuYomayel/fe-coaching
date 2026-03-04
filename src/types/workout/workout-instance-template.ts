import { IWorkoutTemplate } from './workout-template';
import { IExerciseGroupTemplate } from './exercise-group-template';
export interface IWorkoutInstanceTemplate {
  id: number;
  workoutTemplate: IWorkoutTemplate;
  instanceName: string;
  personalizedNotes?: string;
  groups: IExerciseGroupTemplate[];
}
