import { IExercise } from './exercise';
import { IExerciseGroupTemplate } from './exercise-group-template';
export interface IExerciseInstanceTemplate {
  id: number;
  exercise: IExercise;
  group: IExerciseGroupTemplate;
  rowIndex?: number;
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
}
