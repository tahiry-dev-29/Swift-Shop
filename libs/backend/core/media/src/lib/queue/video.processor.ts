import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES, JOB_TYPES } from './queue.constants';
import { VideoJobData } from './video-queue.service';
import { Logger } from '@nestjs/common';

@Processor(QUEUE_NAMES.VIDEO_PROCESSING)
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  async process(job: Job<VideoJobData>) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case JOB_TYPES.RESIZE:
        return this.handleResize(job);
      case JOB_TYPES.MERGE:
        return this.handleMerge(job);
      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  }

  private async handleResize(job: Job<VideoJobData>) {
    this.logger.log(`Resizing video ${job.data.videoId}`);
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, action: 'resize', videoId: job.data.videoId };
  }

  private async handleMerge(job: Job<VideoJobData>) {
    this.logger.log(`Merging video ${job.data.videoId}`);
    // Simulate work
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { success: true, action: 'merge', videoId: job.data.videoId };
  }
}
