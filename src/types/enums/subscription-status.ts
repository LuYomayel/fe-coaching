export const ESubscriptionStatus = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  EXPIRED: 'Expired'
} as const;

export type SubscriptionStatus = (typeof ESubscriptionStatus)[keyof typeof ESubscriptionStatus];
