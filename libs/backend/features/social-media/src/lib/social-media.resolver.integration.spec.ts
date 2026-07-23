import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { SocialMediaResolver } from './social-media.resolver';
import { SocialMediaService } from './social-media.service';
import { AuthUser } from '@swift-shop/backend/auth';

describe('SocialMediaResolver Integration Tests', () => {
  let resolver: SocialMediaResolver;
  let serviceMock: Mocked<SocialMediaService>;

  const mockEmployeeUser: AuthUser = {
    id: 'emp-100',
    type: 'employee',
    email: 'admin@shop.com',
  };

  beforeEach(() => {
    serviceMock = {
      createPost: vi.fn(),
      getPost: vi.fn(),
      triggerCatalogSync: vi.fn(),
    } as unknown as Mocked<SocialMediaService>;

    resolver = new SocialMediaResolver(serviceMock);
  });

  it('createSocialPost — employee creates a new post draft or scheduled post', async () => {
    const input = {
      platform: 'FACEBOOK' as const,
      content: 'Check out our new products!',
    };
    serviceMock.createPost.mockResolvedValue({
      id: 'post-1',
      platform: 'FACEBOOK',
      content: 'Check out our new products!',
      mediaUrls: [],
      status: 'DRAFT',
      scheduledFor: null,
      publishedAt: null,
      externalId: null,
      errorMessage: null,
      employeeId: 'emp-100',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await resolver.createSocialPost(mockEmployeeUser, input);

    expect(res.id).toBe('post-1');
    expect(serviceMock.createPost).toHaveBeenCalledWith(input, 'emp-100');
  });

  it('socialPost — queries post by ID', async () => {
    serviceMock.getPost.mockResolvedValue({
      id: 'post-1',
      platform: 'INSTAGRAM',
      content: 'Insta promo',
    } as never);

    const res = await resolver.socialPost('post-1');

    expect(res.platform).toBe('INSTAGRAM');
  });

  it('syncSocialCatalog — triggers catalog feed sync job', async () => {
    serviceMock.triggerCatalogSync.mockResolvedValue();

    const res = await resolver.syncSocialCatalog();

    expect(res).toBe(true);
    expect(serviceMock.triggerCatalogSync).toHaveBeenCalled();
  });
});
