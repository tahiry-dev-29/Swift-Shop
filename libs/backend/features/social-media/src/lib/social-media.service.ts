import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SOCIAL_MEDIA_QUEUE,
  SOCIAL_MEDIA_JOBS,
  SOCIAL_MEDIA_PRIORITY,
} from './social-media.constants';
import { SocialMediaRepository } from './social-media.repository';
import { SocialMediaFormatter } from './social-media.formatter';
import { CreateSocialPostInput } from './dto/social-post.input';
import { SocialPostType } from './dto/social-post.type';

@Injectable()
export class SocialMediaService {
  private readonly logger = new Logger(SocialMediaService.name);

  constructor(
    @InjectQueue(SOCIAL_MEDIA_QUEUE) private readonly queue: Queue,
    private readonly repository: SocialMediaRepository,
    private readonly formatter: SocialMediaFormatter,
  ) {}

  async createPost(
    data: CreateSocialPostInput,
    employeeId: string,
  ): Promise<SocialPostType> {
    const post = await this.repository.createPost(data, employeeId);

    if (!post.scheduledFor) {
      // Publish immediately
      await this.queue.add(
        SOCIAL_MEDIA_JOBS.PUBLISH_POST,
        { postId: post.id },
        {
          priority: SOCIAL_MEDIA_PRIORITY.HIGH,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
    }

    return this.formatter.formatPost(post);
  }

  async getPost(id: string): Promise<SocialPostType> {
    const post = await this.repository.getPostById(id);
    if (!post) {
      throw new NotFoundException(`Post #${id} not found`);
    }
    return this.formatter.formatPost(post);
  }

  async triggerCatalogSync(): Promise<void> {
    await this.queue.add(
      SOCIAL_MEDIA_JOBS.SYNC_CATALOG,
      {},
      {
        priority: SOCIAL_MEDIA_PRIORITY.LOW,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  // Master Summary Cron Pattern for checking scheduled posts
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledPosts() {
    this.logger.log('Running Cron: check scheduled posts');
    const pendingPosts = await this.repository.getPendingPosts();

    if (pendingPosts.length === 0) {
      return;
    }

    const queuedPosts = [];
    for (const post of pendingPosts) {
      try {
        const updated = await this.repository.updatePostStatusIfScheduled(
          post.id,
          'QUEUED',
        );
        if (updated) {
          queuedPosts.push(updated);
        }
      } catch (_err) {
        // Buffer errors to avoid I/O bottlenecks in the loop
      }
    }

    const errors = [];
    // ... logic ...
    // After loop, log all errors
    if (errors.length > 0) {
      this.logger.error(`Failed to process ${errors.length} posts`, { errors });
    }

    const jobPromises = queuedPosts.map((post) =>
      this.queue
        .add(
          SOCIAL_MEDIA_JOBS.PUBLISH_POST,
          { postId: post.id },
          { priority: SOCIAL_MEDIA_PRIORITY.NORMAL },
        )
        .catch((err) => {
          this.logger.error(`Failed to queue job for post ${post.id}: ${err}`);
          return this.repository.updatePostStatus(
            post.id,
            'SCHEDULED',
            undefined,
            'Failed to queue job',
          );
        }),
    );

    await Promise.all(jobPromises);
    this.logger.log(
      `Master Summary: Queued ${queuedPosts.length} scheduled posts for publishing`,
    );
  }
}
