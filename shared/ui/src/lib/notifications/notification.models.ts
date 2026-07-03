export type NotificationTone = 'info' | 'success' | 'warning' | 'danger';

export interface NotificationItem {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  data?: string;
  readAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  failedAt?: Date | string | null;
  failureReason?: string | null;
  dateAdd: Date | string;
}

export interface NotificationAction {
  label: string;
  value: string;
}
