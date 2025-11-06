import { IClientSubscription } from './client-subscription';
import { IWorkoutTemplate } from '../workout/workout-template';
export interface IClientWorkout {
  id: number;
  clientSubscription: IClientSubscription;
  workoutTemplate: IWorkoutTemplate;
}
