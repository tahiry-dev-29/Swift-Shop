import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { FacebookService } from './facebook.service';
import { ConfigService } from '@nestjs/config';

describe('FacebookService Integration Unit Tests', () => {
  let service: FacebookService;
  let configServiceMock: Mocked<ConfigService>;

  beforeEach(() => {
    configServiceMock = {
      get: vi.fn(),
    } as unknown as Mocked<ConfigService>;

    service = new FacebookService(configServiceMock);
  });

  it('publishPost — returns Facebook external ID string', async () => {
    const extId = await service.publishPost('Facebook content', [
      'http://image.png',
    ]);

    expect(extId).toContain('fb_ext_');
  });

  it('syncCatalog — executes catalog feed sync', async () => {
    await expect(service.syncCatalog()).resolves.toBeUndefined();
  });
});
