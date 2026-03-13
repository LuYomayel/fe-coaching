import { IWorkoutInstance } from '../workout/workout-instance';
import { IClient } from '../models';
import { ISubscription } from '../models';
import { ICoachPlan } from '../coach/coach-plan';
import { IClientWorkout } from './client-workout';
export interface IClientSubscription {
  id: number;
  subscription: ISubscription;
  client: IClient;
  coachPlan: ICoachPlan;
  workoutInstances: IWorkoutInstance[];
  clientWorkouts: IClientWorkout[];
}
