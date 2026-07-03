import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthModule } from '@dima-new/backend/auth';

import { EmailMessageRepository } from './repositories/email-message.repository';
import { EmailThreadRepository } from './repositories/email-thread.repository';
import { EmailTemplateRepository } from './repositories/email-template.repository';

import {
  MessagingService,
  EMAIL_QUEUE_NAME,
} from './services/messaging.service';
import { EmailTemplateService } from './services/email-template.service';

import { EmailProcessor } from './processors/email.processor';

import { MessagingResolver } from './resolvers/messaging.resolver';
import { EmailTemplateResolver } from './resolvers/email-template.resolver';

@Module({
  imports: [
    DataAccessPrismaModule,
    AuthModule,
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  providers: [
    EmailMessageRepository,
    EmailThreadRepository,
    EmailTemplateRepository,
    MessagingService,
    EmailTemplateService,
    EmailProcessor,
    MessagingResolver,
    EmailTemplateResolver,
  ],
  exports: [MessagingService, EmailTemplateService],
})
export class MessagingModule {}
