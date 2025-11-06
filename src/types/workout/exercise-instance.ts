import { IExercise } from './exercise';
import { IExerciseGroup } from './exercise-group';
import { IExerciseSetLog } from './exercise-set-log';
import { IExerciseSetConfiguration } from './exercise-set-configuration';
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
  setConfiguration?: IExerciseSetConfiguration[];
}
