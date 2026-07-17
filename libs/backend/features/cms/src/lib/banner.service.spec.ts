import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { BannerService } from './banner.service';
import { BannerRepository } from './banner.repository';
import { BannerFormatter } from './banner.formatter';
import { BadRequestException } from '@nestjs/common';

describe('BannerService', () => {
  let service: BannerService;
  let repository: Mocked<BannerRepository>;
  let formatter: BannerFormatter;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<BannerRepository>;

    formatter = new BannerFormatter();
    service = new BannerService(repository, formatter);
  });

  describe('createBanner', () => {
    it('should throw BadRequestException if dateFrom is after dateTo', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await expect(
        service.createBanner({
          title: 'Test',
          imageUrl: 'url',
          dateFrom: tomorrow,
          dateTo: now,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateBanner', () => {
    it('should throw BadRequestException if updated dateFrom is after dateTo', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const mockExisting = {
        id: '1',
        title: 'Banner 1',
        imageUrl: 'url',
        linkUrl: null,
        active: true,
        dateFrom: null,
        dateTo: now,
        position: 0,
        dateAdd: now,
        dateUpd: now,
      };

      repository.findById.mockResolvedValue(mockExisting);

      await expect(
        service.updateBanner('1', { dateFrom: tomorrow }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
