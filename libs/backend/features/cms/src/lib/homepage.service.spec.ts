import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { HomepageService } from './homepage.service';
import { HomepageRepository } from './homepage.repository';
import { HomepageFormatter } from './homepage.formatter';
import { NotFoundException } from '@nestjs/common';

describe('HomepageService', () => {
  let service: HomepageService;
  let repository: Mocked<HomepageRepository>;
  let formatter: HomepageFormatter;

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updatePositions: vi.fn(),
    } as unknown as Mocked<HomepageRepository>;

    formatter = new HomepageFormatter();
    service = new HomepageService(repository, formatter);
  });

  describe('reorderBlocks', () => {
    it('should throw NotFoundException if any block ID does not exist', async () => {
      const mockBlock = {
        id: '1',
        title: 'B1',
        type: 'HTML',
        content: null,
        position: 0,
        active: true,
        dateAdd: new Date(),
        dateUpd: new Date(),
      };
      repository.findById.mockResolvedValueOnce(mockBlock);
      repository.findById.mockResolvedValueOnce(null);

      await expect(
        service.reorderBlocks([
          { id: '1', position: 0 },
          { id: '2', position: 1 },
        ]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call updatePositions and return listed blocks', async () => {
      const mockBlock = {
        id: '1',
        title: 'B1',
        type: 'HTML',
        content: null,
        position: 0,
        active: true,
        dateAdd: new Date(),
        dateUpd: new Date(),
      };
      repository.findById.mockResolvedValue(mockBlock);
      repository.updatePositions.mockResolvedValue([mockBlock]);
      repository.findMany.mockResolvedValue([mockBlock]);

      const result = await service.reorderBlocks([{ id: '1', position: 0 }]);
      expect(repository.updatePositions).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });
  });
});
