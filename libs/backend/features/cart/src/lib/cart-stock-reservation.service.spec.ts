import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CartStockReservationService } from './cart-stock-reservation.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { RedisService } from '@swift-shop/backend/auth';
import { BadRequestException } from '@nestjs/common';

function makePrisma(): Mocked<PrismaService> {
  return {
    cart: { findUnique: vi.fn() },
  } as unknown as Mocked<PrismaService>;
}

function makeRedis(): Mocked<RedisService> {
  return {
    setJson: vi.fn().mockResolvedValue(undefined),
    getJson: vi.fn(),
    keysByPattern: vi.fn().mockResolvedValue([]),
    deleteByPattern: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<RedisService>;
}

describe('CartStockReservationService', () => {
  let service: CartStockReservationService;
  let prisma: Mocked<PrismaService>;
  let redisService: Mocked<RedisService>;

  beforeEach(() => {
    prisma = makePrisma();
    redisService = makeRedis();
    service = new CartStockReservationService(prisma, redisService);
  });

  // ─── reserveCartStock ─────────────────────────────────────────────────────

  describe('reserveCartStock', () => {
    it('should throw BadRequestException when cart is empty', async () => {
      prisma.cart.findUnique.mockResolvedValue({
        id: 'cart1',
        items: [],
      } as never);
      await expect(service.reserveCartStock('cart1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when cart not found', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);
      await expect(service.reserveCartStock('cart1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should skip items without outOfStockBehavior=deny', async () => {
      const cartWithAllowItem = {
        id: 'cart1',
        items: [
          {
            product: {
              name: 'Widget',
              stock: {
                outOfStockBehavior: 'allow',
                quantity: 10,
                id: 'stock1',
              },
            },
            combination: null,
            quantity: 5,
          },
        ],
      } as never;
      prisma.cart.findUnique.mockResolvedValue(cartWithAllowItem);

      const result = await service.reserveCartStock('cart1');
      expect(result.reservedItems).toBe(0);
      expect(redisService.setJson).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when available stock is insufficient (other reservations)', async () => {
      const cart = {
        id: 'cart1',
        items: [
          {
            product: {
              name: 'Widget',
              stock: { id: 'stock1', outOfStockBehavior: 'deny', quantity: 5 },
            },
            combination: null,
            quantity: 3,
          },
        ],
      } as never;
      prisma.cart.findUnique.mockResolvedValue(cart);

      // Other carts have reserved 4 units — only 1 left, but we need 3
      redisService.keysByPattern.mockResolvedValue([
        'commerce:stock-lock:cart:cart2:stock:stock1',
      ]);
      redisService.getJson.mockResolvedValue({
        cartId: 'cart2',
        stockId: 'stock1',
        quantity: 4,
        expiresAt: new Date(Date.now() + 900000).toISOString(),
      });

      await expect(service.reserveCartStock('cart1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should store reservation in Redis with correct TTL and return summary', async () => {
      const cart = {
        id: 'cart1',
        items: [
          {
            product: {
              name: 'Widget',
              stock: { id: 'stock1', outOfStockBehavior: 'deny', quantity: 10 },
            },
            combination: null,
            quantity: 2,
          },
        ],
      } as never;
      prisma.cart.findUnique.mockResolvedValue(cart);
      redisService.keysByPattern.mockResolvedValue([]);

      const result = await service.reserveCartStock('cart1', 900);
      expect(redisService.setJson).toHaveBeenCalledWith(
        'commerce:stock-lock:cart:cart1:stock:stock1',
        expect.objectContaining({
          cartId: 'cart1',
          stockId: 'stock1',
          quantity: 2,
        }),
        900,
      );
      expect(result).toMatchObject({ cartId: 'cart1', reservedItems: 1 });
      expect(result.expiresAt).toBeDefined();
    });
  });

  // ─── releaseCartStock ─────────────────────────────────────────────────────

  describe('releaseCartStock', () => {
    it('should call deleteByPattern with correct cart key pattern', async () => {
      await service.releaseCartStock('cart1');
      expect(redisService.deleteByPattern).toHaveBeenCalledWith(
        'commerce:stock-lock:cart:cart1:stock:*',
      );
    });
  });

  // ─── getReservedQuantity ──────────────────────────────────────────────────

  describe('getReservedQuantity', () => {
    it('should sum quantities across all reservations for a stockId', async () => {
      redisService.keysByPattern.mockResolvedValue([
        'commerce:stock-lock:cart:cartA:stock:s1',
        'commerce:stock-lock:cart:cartB:stock:s1',
      ]);
      redisService.getJson
        .mockResolvedValueOnce({
          cartId: 'cartA',
          stockId: 's1',
          quantity: 3,
          expiresAt: '',
        })
        .mockResolvedValueOnce({
          cartId: 'cartB',
          stockId: 's1',
          quantity: 5,
          expiresAt: '',
        });

      const total = await service.getReservedQuantity('s1');
      expect(total).toBe(8);
    });

    it('should exclude the specified cart from quantity sum (excludeCartId)', async () => {
      redisService.keysByPattern.mockResolvedValue([
        'commerce:stock-lock:cart:cart1:stock:s1',
        'commerce:stock-lock:cart:cart2:stock:s1',
      ]);
      redisService.getJson
        .mockResolvedValueOnce({
          cartId: 'cart1',
          stockId: 's1',
          quantity: 3,
          expiresAt: '',
        })
        .mockResolvedValueOnce({
          cartId: 'cart2',
          stockId: 's1',
          quantity: 2,
          expiresAt: '',
        });

      // Exclude cart1 — should only count cart2's reservation
      const total = await service.getReservedQuantity('s1', 'cart1');
      expect(total).toBe(2);
    });

    it('should return 0 when no reservations exist', async () => {
      redisService.keysByPattern.mockResolvedValue([]);
      const total = await service.getReservedQuantity('s1');
      expect(total).toBe(0);
    });
  });
});
