import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthModule } from '@dima-new/backend/auth';

import { SOCIAL_MEDIA_QUEUE } from './social-media.constants';
import { SocialMediaResolver } from './social-media.resolver';
import { SocialMediaService } from './social-media.service';
import { SocialMediaRepository } from './social-media.repository';
import { SocialMediaFormatter } from './social-media.formatter';
import { SocialMediaProcessor } from './social-media.processor';
import { FacebookService } from './integrations/facebook.service';
import { InstagramService } from './integrations/instagram.service';

@Module({
  imports: [
    DataAccessPrismaModule,
    AuthModule,
    BullModule.registerQueue({
      name: SOCIAL_MEDIA_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  providers: [
    SocialMediaResolver,
    SocialMediaService,
    SocialMediaRepository,
    SocialMediaFormatter,
    SocialMediaProcessor,
    FacebookService,
    InstagramService,
  ],
  exports: [SocialMediaService],
})
export class SocialMediaModule {}
