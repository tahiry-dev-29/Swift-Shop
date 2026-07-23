import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CurrencyService } from './currency.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { NotFoundException } from '@nestjs/common';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let prismaMock: {
    currency: {
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
      currency: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new CurrencyService(prismaMock as unknown as PrismaService);
  });

  describe('create', () => {
    it('should unset previous default currency when creating new default currency', async () => {
      prismaMock.currency.create.mockResolvedValue({
        id: 'c-usd',
        name: 'US Dollar',
        code: 'USD',
        symbol: '$',
        isDefault: true,
      });

      await service.create({
        name: 'US Dollar',
        code: 'USD',
        symbol: '$',
        isDefault: true,
      });

      expect(prismaMock.currency.updateMany).toHaveBeenCalledWith({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    });
  });

  describe('delete', () => {
    it('should throw NotFoundException if currency missing', async () => {
      prismaMock.currency.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error if trying to delete default currency', async () => {
      prismaMock.currency.findUnique.mockResolvedValue({
        id: 'cur-def',
        isDefault: true,
      });

      await expect(service.delete('cur-def')).rejects.toThrow(
        'Cannot delete default currency',
      );
    });
  });

  describe('syncExchangeRates', () => {
    it('should update exchange rate for matching currencies', async () => {
      const mockCurrencies = [
        { id: 'c1', code: 'EUR', exchangeRate: { toNumber: () => 1.0 } },
        { id: 'c2', code: 'USD', exchangeRate: { toNumber: () => 1.08 } },
      ];
      prismaMock.currency.findMany.mockResolvedValue(mockCurrencies);

      await service.syncExchangeRates({ EUR: 1.0, USD: 1.1 });

      expect(prismaMock.currency.update).toHaveBeenCalledWith({
        where: { id: 'c2' },
        data: { exchangeRate: 1.1 },
      });
    });
  });
});
