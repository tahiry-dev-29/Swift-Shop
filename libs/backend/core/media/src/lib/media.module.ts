import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { QUEUE_NAMES } from './queue/queue.constants';
import { VideoQueueService } from './queue/video-queue.service';
import { VideoProcessor } from './queue/video.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUE_NAMES.VIDEO_PROCESSING,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    BullBoardModule.forFeature({
      name: QUEUE_NAMES.VIDEO_PROCESSING,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, VideoQueueService, VideoProcessor],
  exports: [MediaService, VideoQueueService],
})
export class MediaModule {}
