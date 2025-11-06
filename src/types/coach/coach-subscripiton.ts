import { ISubscription } from 'types/models';
import { ICoach } from 'types/models';
import { ISubscriptionPlan } from 'types/models';

export interface ICoachSubscription {
  id: number;
  subscription: ISubscription;
  coach: ICoach;
  subscriptionPlan: ISubscriptionPlan;
}
