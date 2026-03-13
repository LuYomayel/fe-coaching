/**
 * Tipos de datos principales del sistema de coaching
 */

// ==================== USUARIOS ====================

export interface IUser {
  id: number;
  userId: number;
  email: string;
  name: string;
  lastName?: string;
  userType: 'coach' | 'client';
  profileImage?: string;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
  subscription?: ISubscription;
}

export interface ICoach extends IUser {
  type: 'coach';
  specialization?: string;
  bio?: string;
  phone?: string;
  country?: string;
  city?: string;
  //bankData?: IBankData;
  subscriptionPlan?: ISubscriptionPlan;
  clients?: IClient[];
}

export interface IClient extends IUser {
  type: 'client';
  coachId?: number;
  coach?: ICoach;
  user?: IUser;
  age?: number;
  weight?: number;
  height?: number;
}

import { SubscriptionStatus } from './enums/subscription-status';
import { IClientSubscription } from './client/client-subscription';
import { ICoachSubscription } from './coach/coach-subscripiton';

export interface ISubscription {
  id: number;
  user: IUser;
  startDate?: Date;
  endDate?: Date;
  status: SubscriptionStatus;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  isDeleted: boolean;
  coachSubscription?: ICoachSubscription;
  clientSubscription?: IClientSubscription;
}

export interface ISubscriptionPlan {
  id: number;
  name: string;
  max_clients: number;
  price: number;
  coachSubscriptions?: ICoachSubscription[];
}


