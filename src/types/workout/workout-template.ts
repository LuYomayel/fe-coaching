import { ICoach } from 'types/models';
import { IWorkoutInstanceTemplate } from './workout-instance-template';
import { IWorkoutInstance } from './workout-instance';
import { IClientWorkout } from '../client/client-workout';
export interface IWorkoutTemplate {
  id: number;
  coach: ICoach;
  planName: string;
  workoutInstanceTemplates: IWorkoutInstanceTemplate[];
  workoutInstances?: IWorkoutInstance[];
  clientWorkouts?: IClientWorkout[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
