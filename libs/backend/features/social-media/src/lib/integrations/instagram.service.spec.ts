import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { InstagramService } from './instagram.service';
import { ConfigService } from '@nestjs/config';

describe('InstagramService Integration Unit Tests', () => {
  let service: InstagramService;
  let configServiceMock: Mocked<ConfigService>;

  beforeEach(() => {
    configServiceMock = {
      get: vi.fn(),
    } as unknown as Mocked<ConfigService>;

    service = new InstagramService(configServiceMock);
  });

  it('publishPost — returns Instagram external ID string', async () => {
    const extId = await service.publishPost('Instagram content', [
      'http://image.png',
    ]);

    expect(extId).toContain('ig_ext_');
  });
});
