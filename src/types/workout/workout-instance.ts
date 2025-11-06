import { IClientSubscription } from '../client/client-subscription';
import { ITrainingSession } from '../training-cycle/training-session';

import { IWorkoutTemplate } from 'types/workout/workout-template';
import { IExerciseGroup } from './exercise-group';
import { IExerciseSetLog } from './exercise-set-log';
import { IWorkoutFeedback } from './workout-feedback';
import { SessionMode } from '../enums/session-mode';

export interface IWorkoutInstance {
  id: number;
  workoutTemplate: IWorkoutTemplate;
  clientSubscription?: IClientSubscription;
  instanceName: string;
  clientFacingName?: string;
  personalizedNotes?: string;
  status?: string;
  groups: IExerciseGroup[];

  trainingSession?: ITrainingSession;
  setLogs?: IExerciseSetLog[];

  expectedEndDate?: Date;
  dateAssigned?: Date;
  feedback?: IWorkoutFeedback;
  sessionMode?: SessionMode;
  location?: string;
  contactMethod?: string;
}
