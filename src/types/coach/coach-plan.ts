import { ICoach } from '../models';

export interface ICoachPlan {
  id: number;
  coach: ICoach;
  name: string;
  price: number;
  workoutsPerWeek: number;
  includeMealPlan: boolean;
  createdAt: string;
  updatedAt: string;
}
