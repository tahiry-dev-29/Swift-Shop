import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ShippingCalculationService } from './shipping-calculation.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { BadRequestException } from '@nestjs/common';

function makePrisma(): Mocked<PrismaService> {
  return {
    shippingZone: { findFirst: vi.fn() },
    shippingRate: { findMany: vi.fn() },
  } as unknown as Mocked<PrismaService>;
}

describe('ShippingCalculationService', () => {
  let service: ShippingCalculationService;
  let prisma: Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new ShippingCalculationService(prisma);
  });

  // ─── getAvailableCarriers ─────────────────────────────────────────────────

  describe('getAvailableCarriers', () => {
    it('should throw BadRequestException when weight is negative', async () => {
      await expect(service.getAvailableCarriers('FR', -1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty array when no shipping zone found for country', async () => {
      prisma.shippingZone.findFirst.mockResolvedValue(null);

      const result = await service.getAvailableCarriers('XZ', 500);
      expect(result).toEqual([]);
    });

    it('should return empty array when no rates match for country + weight', async () => {
      prisma.shippingZone.findFirst.mockResolvedValue({
        id: 'zone1',
        active: true,
      } as never);
      prisma.shippingRate.findMany.mockResolvedValue([]);

      const result = await service.getAvailableCarriers('FR', 500);
      expect(result).toEqual([]);
    });

    it('should return available carriers sorted by price for matching zone + weight', async () => {
      prisma.shippingZone.findFirst.mockResolvedValue({
        id: 'zone1',
        active: true,
      } as never);
      prisma.shippingRate.findMany.mockResolvedValue([
        {
          carrierId: 'c1',
          carrier: { code: 'COLISSIMO', name: 'Colissimo' },
          price: 5.5,
          currency: 'EUR',
        },
        {
          carrierId: 'c2',
          carrier: { code: 'DHL', name: 'DHL Express' },
          price: 12.0,
          currency: 'EUR',
        },
      ] as never);

      const result = await service.getAvailableCarriers('FR', 1000);
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        carrierId: 'c1',
        carrierCode: 'COLISSIMO',
        price: 5.5,
      });
    });

    it('should search zone with uppercased country code', async () => {
      prisma.shippingZone.findFirst.mockResolvedValue(null);

      await service.getAvailableCarriers('fr', 500);
      expect(prisma.shippingZone.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            countries: { has: 'FR' },
          }),
        }),
      );
    });

    it('should handle 0g weight (free item / digital)', async () => {
      prisma.shippingZone.findFirst.mockResolvedValue({ id: 'zone1' } as never);
      prisma.shippingRate.findMany.mockResolvedValue([]);

      const result = await service.getAvailableCarriers('FR', 0);
      expect(result).toEqual([]);
    });
  });

  // ─── calculateShippingCost ────────────────────────────────────────────────

  describe('calculateShippingCost', () => {
    it('should throw BadRequestException when carrier is not available for shipment', async () => {
      prisma.shippingZone.findFirst.mockResolvedValue({ id: 'zone1' } as never);
      prisma.shippingRate.findMany.mockResolvedValue([
        {
          carrierId: 'c1',
          carrier: { code: 'COLISSIMO', name: 'Colissimo' },
          price: 5.5,
          currency: 'EUR',
        },
      ] as never);

      await expect(
        service.calculateShippingCost('c-wrong', 'FR', 500),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return the matching carrier quote', async () => {
      prisma.shippingZone.findFirst.mockResolvedValue({ id: 'zone1' } as never);
      prisma.shippingRate.findMany.mockResolvedValue([
        {
          carrierId: 'c1',
          carrier: { code: 'COLISSIMO', name: 'Colissimo' },
          price: 5.5,
          currency: 'EUR',
        },
      ] as never);

      const result = await service.calculateShippingCost('c1', 'FR', 500);
      expect(result).toMatchObject({
        carrierId: 'c1',
        price: 5.5,
        currency: 'EUR',
      });
    });
  });
});
