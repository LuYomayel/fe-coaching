import { IWorkoutInstance } from './workout-instance';
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
  completed?: boolean;
}
