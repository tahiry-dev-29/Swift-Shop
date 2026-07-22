import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { OrderActionService } from './order-action.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

function makePrisma(): Mocked<PrismaService> {
  return {
    order: { findUnique: vi.fn(), update: vi.fn() },
    orderState: { findUnique: vi.fn(), create: vi.fn() },
    orderHistory: { create: vi.fn() },
    stock: { update: vi.fn() },
    product: { findUnique: vi.fn() },
    return: { create: vi.fn(), findUnique: vi.fn() },
    returnItem: { create: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as Mocked<PrismaService>;
}

function makePubSub(): Mocked<PubSub> {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<PubSub>;
}

function makeOrder(stateName: string, items: unknown[] = []) {
  return {
    id: 'order1',
    state: { id: 'state1', name: stateName },
    items,
  } as never;
}

describe('OrderActionService', () => {
  let service: OrderActionService;
  let prisma: Mocked<PrismaService>;
  let pubSub: Mocked<PubSub>;

  beforeEach(() => {
    prisma = makePrisma();
    pubSub = makePubSub();
    service = new OrderActionService(prisma, pubSub);
  });

  // ─── cancelOrder ─────────────────────────────────────────────────────────

  describe('cancelOrder', () => {
    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.cancelOrder('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when order is already cancelled', async () => {
      prisma.order.findUnique.mockResolvedValue(makeOrder('CANCELLED'));
      await expect(service.cancelOrder('order1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when order is shipped', async () => {
      prisma.order.findUnique.mockResolvedValue(makeOrder('SHIPPED'));
      await expect(service.cancelOrder('order1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when order is delivered', async () => {
      prisma.order.findUnique.mockResolvedValue(makeOrder('DELIVERED'));
      await expect(service.cancelOrder('order1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should cancel order and rollback stock for items', async () => {
      const items = [{ productId: 'p1', combinationId: null, quantity: 3 }];
      prisma.order.findUnique.mockResolvedValue(makeOrder('PENDING', items));
      prisma.orderState.findUnique.mockResolvedValue({
        id: 'cancelled-state',
        name: 'CANCELLED',
      } as never);

      const updatedOrder = {
        id: 'order1',
        state: { name: 'CANCELLED' },
      } as never;
      const mockProduct = {
        id: 'p1',
        stock: { id: 'stock1' },
        combinations: [],
      } as never;

      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            order: { update: vi.fn().mockResolvedValue(updatedOrder) },
            orderHistory: { create: vi.fn() },
            product: { findUnique: vi.fn().mockResolvedValue(mockProduct) },
            stock: { update: vi.fn() },
          };
          return cb(tx);
        }
        return cb;
      });

      const result = await service.cancelOrder('order1');
      expect(result).toBe(updatedOrder);
      expect(pubSub.publish).toHaveBeenCalledWith(
        `orderStatusChanged:order1`,
        expect.objectContaining({ orderStatusChanged: updatedOrder }),
      );
    });

    it('should create CANCELLED state if it does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(makeOrder('PENDING'));
      prisma.orderState.findUnique.mockResolvedValue(null);
      prisma.orderState.create.mockResolvedValue({
        id: 'new-cancel',
        name: 'CANCELLED',
      } as never);

      const updatedOrder = {
        id: 'order1',
        state: { name: 'CANCELLED' },
      } as never;
      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            order: { update: vi.fn().mockResolvedValue(updatedOrder) },
            orderHistory: { create: vi.fn() },
            product: { findUnique: vi.fn().mockResolvedValue(null) }, // no product = skip stock
            stock: { update: vi.fn() },
          };
          return cb(tx);
        }
        return cb;
      });

      await service.cancelOrder('order1');
      expect(prisma.orderState.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'CANCELLED' }),
        }),
      );
    });
  });

  // ─── requestReturn ────────────────────────────────────────────────────────

  describe('requestReturn', () => {
    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.requestReturn('order1', [])).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when order is not DELIVERED', async () => {
      prisma.order.findUnique.mockResolvedValue(
        makeOrder('SHIPPED', [{ id: 'item1' }]),
      );
      await expect(
        service.requestReturn('order1', [
          { orderItemId: 'item1', quantity: 1 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when return quantity exceeds purchased quantity', async () => {
      const order = {
        id: 'order1',
        state: { name: 'DELIVERED' },
        items: [{ id: 'item1', productName: 'Widget', quantity: 2 }],
      } as never;
      prisma.order.findUnique.mockResolvedValue(order);

      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            return: { create: vi.fn().mockResolvedValue({ id: 'ret1' }) },
            returnItem: { create: vi.fn() },
            // findUnique is not directly on tx, handled in service logic
          };
          return cb(tx);
        }
        return cb;
      });

      await expect(
        service.requestReturn('order1', [
          { orderItemId: 'item1', quantity: 5 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create return and return items for DELIVERED order', async () => {
      const order = {
        id: 'order1',
        state: { name: 'DELIVERED' },
        items: [{ id: 'item1', productName: 'Widget', quantity: 3 }],
      } as never;
      prisma.order.findUnique.mockResolvedValue(order);

      const createdReturn = { id: 'ret1', items: [{ id: 'ri1' }] } as never;
      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            return: {
              create: vi.fn().mockResolvedValue({ id: 'ret1' }),
              findUnique: vi.fn().mockResolvedValue(createdReturn),
            },
            returnItem: { create: vi.fn() },
          };
          return cb(tx);
        }
        return cb;
      });

      const result = await service.requestReturn('order1', [
        { orderItemId: 'item1', quantity: 2, reason: 'Damaged' },
      ]);
      expect(result).toBe(createdReturn);
    });

    it('should throw BadRequestException when orderItemId is not part of order', async () => {
      const order = {
        id: 'order1',
        state: { name: 'DELIVERED' },
        items: [{ id: 'item1', productName: 'Widget', quantity: 3 }],
      } as never;
      prisma.order.findUnique.mockResolvedValue(order);

      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            return: { create: vi.fn().mockResolvedValue({ id: 'ret1' }) },
            returnItem: { create: vi.fn() },
          };
          return cb(tx);
        }
        return cb;
      });

      await expect(
        service.requestReturn('order1', [
          { orderItemId: 'nonexistent', quantity: 1 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
