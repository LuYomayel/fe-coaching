import { IWorkoutInstance } from 'types/workout/workout-instance';
import { IClient } from 'types/models';
import { SessionMode } from 'types/enums/session-mode';
import { ITrainingWeek } from './training-week';
export interface ITrainingSession {
  id: number;
  sessionDate: Date;
  dayNumber: number;
  trainingWeek?: ITrainingWeek;
  workoutInstances: IWorkoutInstance[];
  client: IClient;
  sessionMode?: SessionMode;
  sessionTime?: string;
  location?: string;
  contactMethod?: string;
  notes?: string;
  status: string;
}
