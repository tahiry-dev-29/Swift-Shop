import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';

@Injectable()
export class CartMergeService {
  constructor(private readonly prisma: PrismaService) {}

  async mergeGuestCart(sessionId: string, customerId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCustomerCart(customerId);
    }

    const customerCart = await this.prisma.cart.findUnique({
      where: { customerId },
    });
    if (!customerCart) {
      return this.prisma.cart.update({
        where: { id: guestCart.id },
        data: { customerId, sessionId: null },
        include: { items: { include: { product: true, combination: true } } },
      });
    }

    await this.copyGuestItems(guestCart.items, customerCart.id);
    await this.prisma.cart.delete({ where: { id: guestCart.id } });
    return this.prisma.cart.findUnique({
      where: { id: customerCart.id },
      include: { items: { include: { product: true, combination: true } } },
    });
  }

  private getOrCreateCustomerCart(customerId: string) {
    return this.prisma.cart.upsert({
      where: { customerId },
      update: {},
      create: { customerId },
      include: { items: { include: { product: true, combination: true } } },
    });
  }

  private async copyGuestItems(
    items: {
      productId: string;
      combinationId: string | null;
      quantity: number;
    }[],
    cartId: string,
  ) {
    for (const item of items) {
      const existing = await this.prisma.cartItem.findFirst({
        where: {
          cartId,
          productId: item.productId,
          combinationId: item.combinationId,
        },
      });
      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await this.prisma.cartItem.create({ data: { ...item, cartId } });
      }
    }
  }
}
