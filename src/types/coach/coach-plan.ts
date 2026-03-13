import { ICoach } from '../models';

export type PaymentFrequency = 'monthly' | 'weekly' | 'per_session';

export interface ICoachPlan {
  id: number;
  coach: ICoach;
  name: string;
  price: number;
  paymentFrequency: PaymentFrequency;
  createdAt: string;
  updatedAt: string;
}
