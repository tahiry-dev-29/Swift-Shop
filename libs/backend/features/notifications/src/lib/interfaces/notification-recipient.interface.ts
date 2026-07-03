export type NotificationActorType = 'customer' | 'employee';

export interface NotificationRecipient {
  customerId?: string;
  employeeId?: string;
}

export interface NotificationEvent {
  recipient: NotificationRecipient;
  notification: {
    id: string;
    type: string;
    channel: string;
    title: string;
    body: string;
    data?: string;
    readAt?: Date | null;
    deliveredAt?: Date | null;
    dateAdd: Date;
  };
}
