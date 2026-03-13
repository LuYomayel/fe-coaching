import { ITrainingCycle } from './training-cycle';
import { ITrainingSession } from './training-session';

export interface ITrainingWeek {
  id: number;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  trainingCycle: ITrainingCycle;
  trainingSessions: ITrainingSession[];
  trainingCycleTemplate?: ITrainingCycle;
}
