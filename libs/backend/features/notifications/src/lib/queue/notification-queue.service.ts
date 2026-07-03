import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NOTIFICATION_JOB_PRIORITY,
  NOTIFICATION_JOB_TYPES,
  NOTIFICATION_QUEUE_NAME,
} from './notification-queue.constants';
import { NotificationRecipient } from '../interfaces/notification-recipient.interface';

export interface NotificationDeliveryJobData {
  notificationId: string;
  channel: string;
  recipient: NotificationRecipient;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  phoneNumber?: string;
}

@Injectable()
export class NotificationQueueService {
  constructor(
    @InjectQueue(NOTIFICATION_QUEUE_NAME)
    private readonly queue: Queue<NotificationDeliveryJobData>,
  ) {}

  async addDeliveryJob(data: NotificationDeliveryJobData) {
    return this.queue.add(NOTIFICATION_JOB_TYPES.DELIVER, data, {
      priority:
        data.channel === 'IN_APP'
          ? NOTIFICATION_JOB_PRIORITY.HIGH
          : NOTIFICATION_JOB_PRIORITY.NORMAL,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}
