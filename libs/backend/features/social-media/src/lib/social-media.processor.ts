import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  SOCIAL_MEDIA_QUEUE,
  SOCIAL_MEDIA_JOBS,
} from './social-media.constants';
import { SocialMediaRepository } from './social-media.repository';
import { FacebookService } from './integrations/facebook.service';
import { InstagramService } from './integrations/instagram.service';
import {
  PublishPostJobData,
  SyncCatalogJobData,
} from './interfaces/social-media.interface';

@Processor(SOCIAL_MEDIA_QUEUE)
export class SocialMediaProcessor extends WorkerHost {
  private readonly logger = new Logger(SocialMediaProcessor.name);

  constructor(
    private readonly repository: SocialMediaRepository,
    private readonly facebookService: FacebookService,
    private readonly instagramService: InstagramService,
  ) {
    super();
  }

  async process(job: Job<unknown, unknown, string>): Promise<unknown> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    switch (job.name) {
      case SOCIAL_MEDIA_JOBS.PUBLISH_POST:
        return this.handlePublishPost(job as Job<PublishPostJobData>);
      case SOCIAL_MEDIA_JOBS.SYNC_CATALOG:
        return this.handleSyncCatalog(job as Job<SyncCatalogJobData>);
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  }

  private async handlePublishPost(job: Job<PublishPostJobData>) {
    const { postId } = job.data;
    const post = await this.repository.getPostById(postId);

    if (!post) {
      throw new Error(`Post ${postId} not found`);
    }

    try {
      let externalId: string;
      if (post.platform === 'FACEBOOK') {
        externalId = await this.facebookService.publishPost(
          post.content,
          post.mediaUrls,
        );
      } else if (post.platform === 'INSTAGRAM') {
        externalId = await this.instagramService.publishPost(
          post.content,
          post.mediaUrls,
        );
      } else {
        throw new Error(`Unsupported platform ${post.platform}`);
      }

      await this.repository.updatePostStatus(postId, 'PUBLISHED', externalId);
      this.logger.log(
        `Successfully published post ${postId} to ${post.platform}`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to publish post ${postId}: ${errorMessage}`,
        errorStack,
      );
      await this.repository.updatePostStatus(
        postId,
        'FAILED',
        undefined,
        errorMessage,
      );
      throw error; // Re-throw to allow BullMQ to handle retries based on configuration
    }
  }

  private async handleSyncCatalog(_job: Job<SyncCatalogJobData>) {
    this.logger.debug(`Handling sync catalog job: ${_job?.id}`);
    try {
      await this.facebookService.syncCatalog();
      this.logger.log(`Successfully synced Facebook catalog`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to sync Facebook catalog: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
