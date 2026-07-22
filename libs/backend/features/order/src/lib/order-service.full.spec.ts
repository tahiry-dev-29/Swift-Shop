import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { OrderService } from './order-service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartService } from '@swift-shop/backend/cart';
import { OrderExportService } from './order-export.service';
import { OrderInvoiceService } from './order-invoice.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PubSub } from 'graphql-subscriptions';

function makePrisma(): Mocked<PrismaService> {
  return {
    order: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    orderState: { findMany: vi.fn(), findUnique: vi.fn() },
    orderHistory: { create: vi.fn() },
    orderNote: { create: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as Mocked<PrismaService>;
}

function makeCartService(): Mocked<CartService> {
  return {
    getOrder: vi.fn(),
    getOrCreateCart: vi.fn(),
    addToCart: vi.fn(),
    getCartWithTotals: vi.fn(),
  } as unknown as Mocked<CartService>;
}

function makePubSub(): Mocked<PubSub> {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<PubSub>;
}

// Allowed transitions: PENDING → [PROCESSING, CANCELLED], PROCESSING → [SHIPPED, CANCELLED] ...
describe('OrderService', () => {
  let service: OrderService;
  let prisma: Mocked<PrismaService>;
  let cartService: Mocked<CartService>;
  let orderExportService: Mocked<OrderExportService>;
  let orderInvoiceService: Mocked<OrderInvoiceService>;
  let pubSub: Mocked<PubSub>;

  beforeEach(() => {
    prisma = makePrisma();
    cartService = makeCartService();
    orderExportService = {
      exportOrders: vi.fn(),
    } as unknown as Mocked<OrderExportService>;
    orderInvoiceService = {
      generateInvoicePDF: vi.fn(),
    } as unknown as Mocked<OrderInvoiceService>;
    pubSub = makePubSub();

    service = new OrderService(
      prisma,
      cartService,
      orderExportService,
      orderInvoiceService,
      pubSub,
    );
  });

  // ─── getMyOrders ──────────────────────────────────────────────────────────

  describe('getMyOrders', () => {
    it('should return only orders belonging to the customer', async () => {
      const orders = [{ id: 'o1', customerId: 'cust1' }] as never;
      prisma.order.findMany.mockResolvedValue(orders);

      const result = await service.getMyOrders('cust1');
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { customerId: 'cust1' } }),
      );
      expect(result).toBe(orders);
    });
  });

  // ─── getOrder ─────────────────────────────────────────────────────────────

  describe('getOrder', () => {
    it('should throw NotFoundException when order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.getOrder('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when customerId does not own the order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        customerId: 'cust2',
      } as never);
      await expect(service.getOrder('o1', 'cust1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return order when customerId matches', async () => {
      const order = { id: 'o1', customerId: 'cust1' } as never;
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await service.getOrder('o1', 'cust1');
      expect(result).toBe(order);
    });
  });

  // ─── updateOrderStatus (state machine) ───────────────────────────────────

  describe('updateOrderStatus', () => {
    const currentOrder = (stateName: string) => ({
      id: 'o1',
      state: { id: 'sid1', name: stateName },
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.updateOrderStatus('o1', 'state2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when target state not found', async () => {
      prisma.order.findUnique.mockResolvedValue(
        currentOrder('PENDING') as never,
      );
      prisma.orderState.findUnique.mockResolvedValue(null);
      await expect(
        service.updateOrderStatus('o1', 'bad-state-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException on illegal transition (SHIPPED → PENDING)', async () => {
      prisma.order.findUnique.mockResolvedValue(
        currentOrder('SHIPPED') as never,
      );
      prisma.orderState.findUnique.mockResolvedValue({
        id: 'pending-id',
        name: 'PENDING',
      } as never);

      await expect(
        service.updateOrderStatus('o1', 'pending-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on illegal transition (CANCELLED → PROCESSING)', async () => {
      prisma.order.findUnique.mockResolvedValue(
        currentOrder('CANCELLED') as never,
      );
      prisma.orderState.findUnique.mockResolvedValue({
        id: 'proc-id',
        name: 'PROCESSING',
      } as never);

      await expect(service.updateOrderStatus('o1', 'proc-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should allow valid transition PENDING → PROCESSING', async () => {
      prisma.order.findUnique.mockResolvedValue(
        currentOrder('PENDING') as never,
      );
      prisma.orderState.findUnique.mockResolvedValue({
        id: 'proc-id',
        name: 'PROCESSING',
      } as never);

      const updated = { id: 'o1', state: { name: 'PROCESSING' } } as never;
      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            order: { update: vi.fn().mockResolvedValue(updated) },
            orderHistory: { create: vi.fn() },
          };
          return cb(tx);
        }
        return cb;
      });

      const result = await service.updateOrderStatus('o1', 'proc-id');
      expect(result).toBe(updated);
      expect(pubSub.publish).toHaveBeenCalled();
    });

    it('should allow same-state transition (no-op)', async () => {
      prisma.order.findUnique.mockResolvedValue(
        currentOrder('PROCESSING') as never,
      );
      prisma.orderState.findUnique.mockResolvedValue({
        id: 'proc-id',
        name: 'PROCESSING',
      } as never);

      const updated = { id: 'o1', state: { name: 'PROCESSING' } } as never;
      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            order: { update: vi.fn().mockResolvedValue(updated) },
            orderHistory: { create: vi.fn() },
          };
          return cb(tx);
        }
        return cb;
      });

      await expect(
        service.updateOrderStatus('o1', 'proc-id'),
      ).resolves.not.toThrow();
    });

    it('should allow SHIPPED → DELIVERED', async () => {
      prisma.order.findUnique.mockResolvedValue(
        currentOrder('SHIPPED') as never,
      );
      prisma.orderState.findUnique.mockResolvedValue({
        id: 'del-id',
        name: 'DELIVERED',
      } as never);

      const updated = { id: 'o1', state: { name: 'DELIVERED' } } as never;
      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            order: { update: vi.fn().mockResolvedValue(updated) },
            orderHistory: { create: vi.fn() },
          };
          return cb(tx);
        }
        return cb;
      });

      const result = await service.updateOrderStatus('o1', 'del-id');
      expect(result).toBe(updated);
    });
  });

  // ─── reorderToCart ────────────────────────────────────────────────────────

  describe('reorderToCart', () => {
    it('should re-add all order items to a new or existing cart', async () => {
      const order = {
        id: 'o1',
        customerId: 'cust1',
        items: [
          { productId: 'p1', quantity: 2, combinationId: null },
          { productId: 'p2', quantity: 1, combinationId: 'c1' },
        ],
        state: {},
        addresses: [],
        customer: {},
      } as never;
      const cart = { id: 'cart1' } as never;
      const cartWithTotals = { id: 'cart1', totalTTC: 200 } as never;

      prisma.order.findUnique.mockResolvedValue(order);
      cartService.getOrCreateCart.mockResolvedValue(cart);
      cartService.addToCart.mockResolvedValue({} as never);
      cartService.getCartWithTotals.mockResolvedValue(cartWithTotals);

      const result = await service.reorderToCart('o1', 'cust1');
      expect(cartService.addToCart).toHaveBeenCalledTimes(2);
      expect(cartService.addToCart).toHaveBeenCalledWith(
        'cart1',
        'p1',
        2,
        undefined,
      );
      expect(cartService.addToCart).toHaveBeenCalledWith(
        'cart1',
        'p2',
        1,
        'c1',
      );
      expect(result).toBe(cartWithTotals);
    });
  });

  // ─── addOrderNote ─────────────────────────────────────────────────────────

  describe('addOrderNote', () => {
    it('should throw NotFoundException when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.addOrderNote('o1', 'Test note')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create an internal note', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1' } as never);
      const note = {
        id: 'n1',
        content: 'Staff note',
        isInternal: true,
      } as never;
      prisma.orderNote.create.mockResolvedValue(note);

      const result = await service.addOrderNote(
        'o1',
        'Staff note',
        true,
        'emp1',
      );
      expect(prisma.orderNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Staff note',
            isInternal: true,
          }),
        }),
      );
      expect(result).toBe(note);
    });

    it('should create a customer-visible note', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1' } as never);
      const note = {
        id: 'n2',
        content: 'Your order is delayed',
        isInternal: false,
      } as never;
      prisma.orderNote.create.mockResolvedValue(note);

      const result = await service.addOrderNote(
        'o1',
        'Your order is delayed',
        false,
      );
      expect(prisma.orderNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isInternal: false }),
        }),
      );
      expect(result).toBe(note);
    });
  });

  // ─── generateInvoicePDF ───────────────────────────────────────────────────

  describe('generateInvoicePDF', () => {
    it('should delegate to OrderInvoiceService', async () => {
      const pdf = { url: '/invoices/inv-1.pdf' } as never;
      orderInvoiceService.generateInvoicePDF.mockResolvedValue(pdf);

      const result = await service.generateInvoicePDF('o1');
      expect(orderInvoiceService.generateInvoicePDF).toHaveBeenCalledWith('o1');
      expect(result).toBe(pdf);
    });
  });
});
