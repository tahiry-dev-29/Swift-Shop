import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_TYPES, JOB_PRIORITY } from './queue.constants';

export interface VideoJobData {
  videoId: string;
  options?: Record<string, unknown>;
}

@Injectable()
export class VideoQueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.VIDEO_PROCESSING) private queue: Queue,
  ) {}

  async addResizeJob(data: VideoJobData) {
    return this.queue.add(JOB_TYPES.RESIZE, data, {
      priority: JOB_PRIORITY.NORMAL,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addMergeJob(data: VideoJobData) {
    return this.queue.add(JOB_TYPES.MERGE, data, {
      priority: JOB_PRIORITY.HIGH,
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    });
  }
}
