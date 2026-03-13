export const EWorkoutStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  CURRENT: 'current'
} as const;

export type WorkoutStatus = (typeof EWorkoutStatus)[keyof typeof EWorkoutStatus];
