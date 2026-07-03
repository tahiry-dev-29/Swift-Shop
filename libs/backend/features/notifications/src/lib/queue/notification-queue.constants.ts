export const NOTIFICATION_QUEUE_NAME = 'notifications';

export const NOTIFICATION_JOB_TYPES = {
  DELIVER: 'deliver-notification',
} as const;

export const NOTIFICATION_JOB_PRIORITY = {
  HIGH: 1,
  NORMAL: 5,
  LOW: 10,
} as const;
