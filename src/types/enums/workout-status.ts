export const EWorkoutStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} as const;

export type WorkoutStatus = (typeof EWorkoutStatus)[keyof typeof EWorkoutStatus];
