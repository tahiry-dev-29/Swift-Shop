import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { SocialMediaService } from './social-media.service';
import { SocialMediaRepository } from './social-media.repository';
import { SocialMediaFormatter } from './social-media.formatter';
import { Queue } from 'bullmq';
import { NotFoundException } from '@nestjs/common';

describe('SocialMediaService', () => {
  let service: SocialMediaService;
  let queueMock: Mocked<Queue>;
  let repositoryMock: Mocked<SocialMediaRepository>;
  let formatter: SocialMediaFormatter;

  beforeEach(() => {
    queueMock = {
      add: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<Queue>;

    repositoryMock = {
      createPost: vi.fn(),
      getPostById: vi.fn(),
      getPendingPosts: vi.fn(),
      updatePostStatusIfScheduled: vi.fn(),
      updatePostStatus: vi.fn(),
    } as unknown as Mocked<SocialMediaRepository>;

    formatter = new SocialMediaFormatter();
    service = new SocialMediaService(queueMock, repositoryMock, formatter);
  });

  describe('createPost', () => {
    it('should queue immediate publish job when scheduledFor is not provided', async () => {
      repositoryMock.createPost.mockResolvedValue({
        id: 'post-1',
        platform: 'FACEBOOK',
        content: 'New sale!',
        mediaUrls: [],
        status: 'DRAFT',
        scheduledFor: null,
        publishedAt: null,
        externalId: null,
        errorMessage: null,
        employeeId: 'emp-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const post = await service.createPost(
        { platform: 'FACEBOOK', content: 'New sale!' },
        'emp-1',
      );

      expect(queueMock.add).toHaveBeenCalledWith(
        'publish-post',
        { postId: 'post-1' },
        expect.objectContaining({ priority: 1 }),
      );
      expect(post.id).toBe('post-1');
    });
  });

  describe('getPost', () => {
    it('should throw NotFoundException if post is missing', async () => {
      repositoryMock.getPostById.mockResolvedValue(null);

      await expect(service.getPost('missing-post')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processScheduledPosts (Cron)', () => {
    it('should query pending scheduled posts and queue them for publishing', async () => {
      repositoryMock.getPendingPosts.mockResolvedValue([
        { id: 'sched-1' } as never,
      ]);
      repositoryMock.updatePostStatusIfScheduled.mockResolvedValue({
        id: 'sched-1',
        status: 'QUEUED',
      } as never);

      await service.processScheduledPosts();

      expect(repositoryMock.updatePostStatusIfScheduled).toHaveBeenCalledWith(
        'sched-1',
        'QUEUED',
      );
      expect(queueMock.add).toHaveBeenCalledWith(
        'publish-post',
        { postId: 'sched-1' },
        expect.objectContaining({ priority: 5 }),
      );
    });
  });
});
