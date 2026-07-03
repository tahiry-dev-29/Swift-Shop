import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  NOTIFICATION_JOB_TYPES,
  NOTIFICATION_QUEUE_NAME,
} from './notification-queue.constants';
import { NotificationDeliveryJobData } from './notification-queue.service';
import { NotificationService } from '../notification.service';

@Processor(NOTIFICATION_QUEUE_NAME)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<NotificationDeliveryJobData>) {
    switch (job.name) {
      case NOTIFICATION_JOB_TYPES.DELIVER:
        return this.notificationService.dispatchDeliveryJob(job.data);
      default:
        this.logger.warn(`Unknown notification job: ${job.name}`);
        throw new Error(`Unknown notification job: ${job.name}`);
    }
  }
}
