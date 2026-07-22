import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';

@Injectable()
export class CartMergeService {
  constructor(private readonly prisma: PrismaService) {}

  async mergeGuestCart(sessionId: string, customerId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: { include: { stock: true } },
            combination: { include: { stock: true } },
          },
        },
      },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCustomerCart(customerId);
    }

    for (const item of guestCart.items) {
      const stock = item.combination?.stock || item.product.stock;
      if (
        stock &&
        stock.outOfStockBehavior === 'deny' &&
        stock.quantity < item.quantity
      ) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}: only ${stock.quantity} available`,
        );
      }
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

    await this.prisma.$transaction(async (tx) => {
      for (const item of guestCart.items) {
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: customerCart.id,
            productId: item.productId,
            combinationId: item.combinationId,
          },
        });
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: { increment: item.quantity } },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: customerCart.id,
              productId: item.productId,
              combinationId: item.combinationId,
              quantity: item.quantity,
            },
          });
        }
      }
      await tx.cart.delete({ where: { id: guestCart.id } });
    });

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
}
