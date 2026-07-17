import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CmsPageService } from './cms-page.service';
import { CmsPageRepository } from './cms-page.repository';
import { CmsPageFormatter } from './cms-page.formatter';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CmsPageService', () => {
  let service: CmsPageService;
  let repository: Mocked<CmsPageRepository>;
  let formatter: CmsPageFormatter;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findBySlug: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      countBySlug: vi.fn(),
    } as unknown as Mocked<CmsPageRepository>;

    formatter = new CmsPageFormatter();
    service = new CmsPageService(repository, formatter);
  });

  describe('createPage', () => {
    it('should throw BadRequestException if slug is already in use', async () => {
      repository.countBySlug.mockResolvedValue(1);

      await expect(
        service.createPage({ title: 'Test', slug: 'test', content: 'content' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and return the formatted page', async () => {
      const mockRecord = {
        id: '1',
        title: 'Test',
        slug: 'test',
        content: 'content',
        active: true,
        metaTitle: null,
        metaDescription: null,
        dateAdd: new Date(),
        dateUpd: new Date(),
      };
      repository.countBySlug.mockResolvedValue(0);
      repository.create.mockResolvedValue(mockRecord);

      const result = await service.createPage({
        title: 'Test',
        slug: 'test',
        content: 'content',
      });

      expect(result.id).toBe('1');
      expect(result.title).toBe('Test');
    });
  });

  describe('getPage', () => {
    it('should throw NotFoundException if page is not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getPage('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePage', () => {
    it('should check slug uniqueness if slug is updated', async () => {
      const mockExisting = {
        id: '1',
        title: 'Title',
        slug: 'old',
        content: 'content',
        active: true,
        metaTitle: null,
        metaDescription: null,
        dateAdd: new Date(),
        dateUpd: new Date(),
      };
      repository.findById.mockResolvedValue(mockExisting);
      repository.countBySlug.mockResolvedValue(1);

      await expect(service.updatePage('1', { slug: 'new' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
