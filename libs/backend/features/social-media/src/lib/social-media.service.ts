import { Injectable, Logger } from '@nestjs/common';
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
      throw new Error(`Post not found`);
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

    const jobPromises = pendingPosts.map((post) =>
      this.queue.add(
        SOCIAL_MEDIA_JOBS.PUBLISH_POST,
        { postId: post.id },
        { priority: SOCIAL_MEDIA_PRIORITY.NORMAL },
      ),
    );

    await Promise.all(jobPromises);
    this.logger.log(
      `Master Summary: Queued ${pendingPosts.length} scheduled posts for publishing`,
    );
  }
}
