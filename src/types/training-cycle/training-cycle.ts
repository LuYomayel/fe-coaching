import { IClient, ICoach } from 'types/models';
import { ITrainingWeek } from './training-week';

export interface ITrainingCycle {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  coach: ICoach;
  trainingWeeks: ITrainingWeek[];
  client: IClient;
  isDurationInMonths: boolean;
}
