import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PriceQueryService } from './price-query.service';
import { PrismaService } from '@swift-shop/data-access-prisma';

function makePrisma(): Mocked<PrismaService> {
  return {
    customer: { findUnique: vi.fn() },
    specificPrice: { findMany: vi.fn() },
    taxRule: { findFirst: vi.fn() },
    country: { findUnique: vi.fn() },
  } as unknown as Mocked<PrismaService>;
}

describe('PriceQueryService', () => {
  let service: PriceQueryService;
  let prisma: Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new PriceQueryService(prisma);
  });

  // ─── findBestSpecificPrice ────────────────────────────────────────────────

  describe('findBestSpecificPrice', () => {
    const BASE_PARAMS = {
      productId: 'p1',
      countryId: 'FR',
      quantity: 1,
    };

    it('should return null when no specific prices match', async () => {
      prisma.specificPrice.findMany.mockResolvedValue([]);

      const result = await service.findBestSpecificPrice(BASE_PARAMS);
      expect(result).toBeNull();
    });

    it('should return highest-priority matching specific price', async () => {
      const prices = [
        { id: 'sp1', priority: 2, reduction: 10, reductionType: 'percentage' },
        { id: 'sp2', priority: 1, reduction: 5, reductionType: 'amount' },
      ];
      prisma.specificPrice.findMany.mockResolvedValue(prices as never);

      const result = await service.findBestSpecificPrice(BASE_PARAMS);
      // findMany returns ordered by priority desc → first result is the best
      expect(result).toBe(prices[0]);
    });

    it('should resolve customer group ID when customerId is provided', async () => {
      prisma.customer.findUnique.mockResolvedValue({
        groupId: 'grp1',
      } as never);
      prisma.specificPrice.findMany.mockResolvedValue([]);

      await service.findBestSpecificPrice({
        ...BASE_PARAMS,
        customerId: 'cust1',
      });

      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'cust1' },
        select: { groupId: true },
      });
      // customerGroupId should be included in the OR conditions
      expect(prisma.specificPrice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ customerGroupId: 'grp1' }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should not query customer when customerId is absent', async () => {
      prisma.specificPrice.findMany.mockResolvedValue([]);

      await service.findBestSpecificPrice(BASE_PARAMS);
      expect(prisma.customer.findUnique).not.toHaveBeenCalled();
    });

    it('should include combinationId in targets when provided', async () => {
      prisma.specificPrice.findMany.mockResolvedValue([]);

      await service.findBestSpecificPrice({
        ...BASE_PARAMS,
        combinationId: 'c1',
      });

      expect(prisma.specificPrice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ combinationId: 'c1' }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should include quantity condition (fromQuantity ≤ quantity)', async () => {
      prisma.specificPrice.findMany.mockResolvedValue([]);

      await service.findBestSpecificPrice({ ...BASE_PARAMS, quantity: 5 });

      expect(prisma.specificPrice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ fromQuantity: { lte: 5 } }]),
          }),
        }),
      );
    });

    it('should query only active specific prices', async () => {
      prisma.specificPrice.findMany.mockResolvedValue([]);

      await service.findBestSpecificPrice(BASE_PARAMS);

      expect(prisma.specificPrice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ active: true }]),
          }),
        }),
      );
    });

    it('should handle customer with no group (groupId null)', async () => {
      prisma.customer.findUnique.mockResolvedValue({ groupId: null } as never);
      prisma.specificPrice.findMany.mockResolvedValue([]);

      // Should not crash and should NOT include customerGroupId condition
      await expect(
        service.findBestSpecificPrice({
          ...BASE_PARAMS,
          customerId: 'cust-no-group',
        }),
      ).resolves.toBeNull();
    });
  });

  // ─── getTaxRate ───────────────────────────────────────────────────────────

  describe('getTaxRate', () => {
    it('should return tax rate from matching taxRule', async () => {
      prisma.taxRule.findFirst.mockResolvedValue({ rate: '20.00' } as never);

      const result = await service.getTaxRate('FR');
      expect(result).toBe(20);
    });

    it('should fall back to country.taxRate when no taxRule matches', async () => {
      prisma.taxRule.findFirst.mockResolvedValue(null);
      prisma.country.findUnique.mockResolvedValue({
        id: 'US',
        taxRate: '8.5',
      } as never);

      const result = await service.getTaxRate('US');
      expect(result).toBe(8.5);
    });

    it('should throw when neither taxRule nor country found', async () => {
      prisma.taxRule.findFirst.mockResolvedValue(null);
      prisma.country.findUnique.mockResolvedValue(null);

      await expect(service.getTaxRate('ZZ')).rejects.toThrow(
        'Country #ZZ not found',
      );
    });

    it('should always query active taxRules for the given countryId', async () => {
      prisma.taxRule.findFirst.mockResolvedValue({ rate: '10' } as never);

      await service.getTaxRate('DE');
      expect(prisma.taxRule.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { countryId: 'DE', active: true },
        }),
      );
    });
  });
});
