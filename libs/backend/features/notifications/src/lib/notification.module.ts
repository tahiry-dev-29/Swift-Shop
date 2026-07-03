import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthModule } from '@dima-new/backend/auth';
import { NotificationFormatter } from './notification.formatter';
import { NotificationGateway } from './notification.gateway';
import { NotificationRepository } from './notification.repository';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';
import { NotificationSseController } from './notification-sse.controller';
import { NotificationTransportService } from './notification-transport.service';
import { PushNotificationService } from './push-notification.service';
import { SmsNotificationService } from './sms-notification.service';
import { NOTIFICATION_QUEUE_NAME } from './queue/notification-queue.constants';
import { NotificationProcessor } from './queue/notification.processor';
import { NotificationQueueService } from './queue/notification-queue.service';

@Module({
  imports: [
    DataAccessPrismaModule,
    AuthModule,
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullBoardModule.forFeature({
      name: NOTIFICATION_QUEUE_NAME,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [NotificationSseController],
  providers: [
    NotificationFormatter,
    NotificationGateway,
    NotificationRepository,
    NotificationResolver,
    NotificationService,
    NotificationTransportService,
    PushNotificationService,
    SmsNotificationService,
    NotificationProcessor,
    NotificationQueueService,
  ],
  exports: [
    NotificationService,
    PushNotificationService,
    SmsNotificationService,
    NotificationQueueService,
  ],
})
export class NotificationModule {}
