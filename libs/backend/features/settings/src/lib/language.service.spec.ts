import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguageService } from './language.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { NotFoundException } from '@nestjs/common';

describe('LanguageService', () => {
  let service: LanguageService;
  let prismaMock: {
    language: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      language: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new LanguageService(prismaMock as unknown as PrismaService);
  });

  describe('create', () => {
    it('should unset previous default language if new language is set as default', async () => {
      prismaMock.language.create.mockResolvedValue({
        id: 'lang-en',
        name: 'English',
        code: 'en',
        locale: 'en-US',
        isDefault: true,
      });

      await service.create({
        name: 'English',
        code: 'en',
        locale: 'en-US',
        isDefault: true,
      });

      expect(prismaMock.language.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      expect(prismaMock.language.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should unset default flag on other languages if updating language as default', async () => {
      prismaMock.language.update.mockResolvedValue({
        id: 'lang-fr',
        name: 'French',
        code: 'fr',
        isDefault: true,
      });

      await service.update('lang-fr', { isDefault: true });

      expect(prismaMock.language.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true, id: { not: 'lang-fr' } },
        data: { isDefault: false },
      });
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if language does not exist', async () => {
      prismaMock.language.findUnique.mockResolvedValue(null);

      await expect(service.delete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when attempting to delete the default language', async () => {
      prismaMock.language.findUnique.mockResolvedValue({
        id: 'lang-def',
        isDefault: true,
      });

      await expect(service.delete('lang-def')).rejects.toThrow(
        'Cannot delete default language',
      );
    });

    it('should delete language if not default', async () => {
      prismaMock.language.findUnique.mockResolvedValue({
        id: 'lang-es',
        isDefault: false,
      });
      prismaMock.language.delete.mockResolvedValue({ id: 'lang-es' });

      const res = await service.delete('lang-es');

      expect(res.id).toBe('lang-es');
    });
  });

  describe('setDefault', () => {
    it('should update language setting isDefault to true', async () => {
      prismaMock.language.update.mockResolvedValue({
        id: 'lang-de',
        isDefault: true,
      });

      const res = await service.setDefault('lang-de');

      expect(res.isDefault).toBe(true);
    });
  });
});
