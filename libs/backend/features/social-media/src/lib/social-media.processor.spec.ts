import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { SocialMediaProcessor } from './social-media.processor';
import { SocialMediaRepository } from './social-media.repository';
import { FacebookService } from './integrations/facebook.service';
import { InstagramService } from './integrations/instagram.service';
import { Job } from 'bullmq';

describe('SocialMediaProcessor Queue Worker', () => {
  let processor: SocialMediaProcessor;
  let repoMock: Mocked<SocialMediaRepository>;
  let fbMock: Mocked<FacebookService>;
  let igMock: Mocked<InstagramService>;

  beforeEach(() => {
    repoMock = {
      getPostById: vi.fn(),
      updatePostStatus: vi.fn(),
    } as unknown as Mocked<SocialMediaRepository>;

    fbMock = {
      publishPost: vi.fn(),
      syncCatalog: vi.fn(),
    } as unknown as Mocked<FacebookService>;

    igMock = {
      publishPost: vi.fn(),
    } as unknown as Mocked<InstagramService>;

    processor = new SocialMediaProcessor(repoMock, fbMock, igMock);
  });

  it('handlePublishPost — publishes Facebook post and marks status as PUBLISHED', async () => {
    const mockJob = {
      name: 'publish-post',
      data: { postId: 'p1' },
    } as Job;

    repoMock.getPostById.mockResolvedValue({
      id: 'p1',
      platform: 'FACEBOOK',
      content: 'Facebook content',
      mediaUrls: ['http://img.png'],
    } as never);
    fbMock.publishPost.mockResolvedValue('fb_123');

    await processor.process(mockJob);

    expect(fbMock.publishPost).toHaveBeenCalledWith('Facebook content', [
      'http://img.png',
    ]);
    expect(repoMock.updatePostStatus).toHaveBeenCalledWith(
      'p1',
      'PUBLISHED',
      'fb_123',
    );
  });

  it('handlePublishPost — publishes Instagram post and marks status as PUBLISHED', async () => {
    const mockJob = {
      name: 'publish-post',
      data: { postId: 'p2' },
    } as Job;

    repoMock.getPostById.mockResolvedValue({
      id: 'p2',
      platform: 'INSTAGRAM',
      content: 'Instagram content',
      mediaUrls: [],
    } as never);
    igMock.publishPost.mockResolvedValue('ig_456');

    await processor.process(mockJob);

    expect(igMock.publishPost).toHaveBeenCalledWith('Instagram content', []);
    expect(repoMock.updatePostStatus).toHaveBeenCalledWith(
      'p2',
      'PUBLISHED',
      'ig_456',
    );
  });

  it('handlePublishPost — marks status FAILED when integration throws error', async () => {
    const mockJob = {
      name: 'publish-post',
      data: { postId: 'p3' },
    } as Job;

    repoMock.getPostById.mockResolvedValue({
      id: 'p3',
      platform: 'FACEBOOK',
      content: 'Facebook content',
      mediaUrls: [],
    } as never);
    fbMock.publishPost.mockRejectedValue(new Error('Graph API Error 500'));

    await expect(processor.process(mockJob)).rejects.toThrow(
      'Graph API Error 500',
    );
    expect(repoMock.updatePostStatus).toHaveBeenCalledWith(
      'p3',
      'FAILED',
      undefined,
      'Graph API Error 500',
    );
  });
});
