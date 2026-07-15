import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { OrderActionService } from './order-action.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { PubSub } from 'graphql-subscriptions';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrderActionService', () => {
  let service: OrderActionService;
  let prisma: Mocked<PrismaService>;
  let pubSub: Mocked<PubSub>;

  beforeEach(() => {
    prisma = {
      order: { findUnique: vi.fn(), update: vi.fn() },
      orderState: { findUnique: vi.fn(), create: vi.fn() },
      orderHistory: { create: vi.fn() },
      product: { findUnique: vi.fn() },
      stock: { update: vi.fn() },
      $transaction: vi.fn((cb) => cb(prisma)),
    } as unknown as Mocked<PrismaService>;

    pubSub = {
      publish: vi.fn(),
    } as unknown as Mocked<PubSub>;

    service = new OrderActionService(prisma, pubSub);
  });

  it('should throw NotFoundException if order not found', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    await expect(service.cancelOrder('order1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException if order is already cancelled', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      state: { name: 'CANCELLED' },
      items: [],
    } as never);

    await expect(service.cancelOrder('order1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw BadRequestException if order is already shipped', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      state: { name: 'SHIPPED' },
      items: [],
    } as never);

    await expect(service.cancelOrder('order1')).rejects.toThrow(
      BadRequestException,
    );
  });
});
