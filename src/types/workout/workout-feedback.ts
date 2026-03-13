import { IWorkoutInstance } from './workout-instance';
import { IUser } from 'types/models';

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
