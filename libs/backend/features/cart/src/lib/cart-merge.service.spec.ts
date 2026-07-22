import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CartMergeService } from './cart-merge.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { BadRequestException } from '@nestjs/common';

function makePrisma(): Mocked<PrismaService> {
  return {
    cart: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    cartItem: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  } as unknown as Mocked<PrismaService>;
}

describe('CartMergeService', () => {
  let service: CartMergeService;
  let prisma: Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new CartMergeService(prisma);
  });

  // ─── mergeGuestCart — guest is empty ──────────────────────────────────────

  describe('when guest cart is empty or missing', () => {
    it('should upsert and return customer cart when guest cart has no items', async () => {
      const customerCart = { id: 'cust-cart', items: [] } as never;
      prisma.cart.findUnique.mockResolvedValue({
        id: 'guest-cart',
        items: [],
      } as never);
      prisma.cart.upsert.mockResolvedValue(customerCart);

      const result = await service.mergeGuestCart('sess1', 'cust1');
      expect(result).toBe(customerCart);
    });

    it('should upsert customer cart when guest cart does not exist', async () => {
      const customerCart = { id: 'cust-cart', items: [] } as never;
      prisma.cart.findUnique.mockResolvedValue(null);
      prisma.cart.upsert.mockResolvedValue(customerCart);

      const result = await service.mergeGuestCart('sess1', 'cust1');
      expect(result).toBe(customerCart);
    });
  });

  // ─── mergeGuestCart — guest has items ─────────────────────────────────────

  describe('when guest cart has items', () => {
    const guestItem = {
      id: 'item-guest1',
      productId: 'p1',
      combinationId: null,
      quantity: 2,
      product: {
        name: 'Widget',
        stock: { outOfStockBehavior: 'allow', quantity: 100 },
      },
      combination: null,
    };

    it('should throw BadRequestException if item stock is insufficient during merge', async () => {
      const insufficientItem = {
        ...guestItem,
        product: {
          name: 'Widget',
          stock: { outOfStockBehavior: 'deny', quantity: 1 },
        },
        quantity: 5,
      };
      prisma.cart.findUnique.mockResolvedValue({
        id: 'guest-cart',
        items: [insufficientItem],
      } as never);

      await expect(service.mergeGuestCart('sess1', 'cust1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should transfer guest cart to customer when customer has no cart', async () => {
      const merged = { id: 'merged-cart', customerId: 'cust1' } as never;
      prisma.cart.findUnique
        .mockResolvedValueOnce({
          id: 'guest-cart',
          items: [guestItem],
        } as never) // guest
        .mockResolvedValueOnce(null); // customer cart — none
      prisma.cart.update.mockResolvedValue(merged);

      const result = await service.mergeGuestCart('sess1', 'cust1');
      expect(prisma.cart.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'guest-cart' },
          data: { customerId: 'cust1', sessionId: null },
        }),
      );
      expect(result).toBe(merged);
    });

    it('should merge items into existing customer cart and delete guest cart', async () => {
      const customerCart = { id: 'cust-cart', items: [] } as never;
      const finalCart = {
        id: 'cust-cart',
        items: [{ productId: 'p1', quantity: 2 }],
      } as never;

      prisma.cart.findUnique
        .mockResolvedValueOnce({
          id: 'guest-cart',
          items: [guestItem],
        } as never) // guest
        .mockResolvedValueOnce(customerCart) // customer exists
        .mockResolvedValueOnce(finalCart); // final cart after merge

      const txFn = vi.fn(async (cb: (tx: unknown) => unknown) => {
        const tx = {
          cartItem: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
            update: vi.fn(),
          },
          cart: { delete: vi.fn() },
        };
        return cb(tx);
      });
      prisma.$transaction.mockImplementation(txFn);

      const result = await service.mergeGuestCart('sess1', 'cust1');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBe(finalCart);
    });

    it('should increment quantity of existing item when merging duplicates', async () => {
      const customerCart = { id: 'cust-cart' } as never;
      const existingItem = { id: 'existing-item', quantity: 3 };

      prisma.cart.findUnique
        .mockResolvedValueOnce({
          id: 'guest-cart',
          items: [guestItem],
        } as never)
        .mockResolvedValueOnce(customerCart)
        .mockResolvedValueOnce({ id: 'cust-cart', items: [] } as never);

      const mockTxCartItem = {
        findFirst: vi.fn().mockResolvedValue(existingItem),
        update: vi.fn(),
        create: vi.fn(),
      };
      const txFn = vi.fn(async (cb: (tx: unknown) => unknown) => {
        const tx = {
          cartItem: mockTxCartItem,
          cart: { delete: vi.fn() },
        };
        return cb(tx);
      });
      prisma.$transaction.mockImplementation(txFn);

      await service.mergeGuestCart('sess1', 'cust1');
      expect(mockTxCartItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { quantity: { increment: guestItem.quantity } },
        }),
      );
      expect(mockTxCartItem.create).not.toHaveBeenCalled();
    });
  });
});
