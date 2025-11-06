export const ESessionMode = {
  PRESENTIAL: 'presencial',
  VIRTUAL_SYNCHRONOUS: 'virtual_synchronous',
  VIRTUAL_ASYNCHRONOUS: 'virtual_asynchronous',
  HYBRID: 'hybrid'
} as const;

export type SessionMode = (typeof ESessionMode)[keyof typeof ESessionMode];
