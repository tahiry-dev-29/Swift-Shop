import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartMergeService } from './cart-merge.service';
import { CartPricingService } from './cart-pricing.service';
import { CartCouponService } from './cart-coupon.service';
import { CartStockReservationService } from './cart-stock-reservation.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartMergeService: CartMergeService,
    private readonly cartPricingService: CartPricingService,
    private readonly cartCouponService: CartCouponService,
    private readonly cartStockReservationService: CartStockReservationService,
  ) {}

  async getOrCreateCart(customerId?: string, sessionId?: string) {
    if (!customerId && !sessionId) {
      throw new BadRequestException(
        'Either customerId or sessionId is required',
      );
    }

    const where = customerId ? { customerId } : { sessionId };
    const include = {
      items: { include: { product: true, combination: true } },
    };

    let cart = await this.prisma.cart.findFirst({ where, include });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: where, include });
    }

    return cart;
  }

  async addToCart(
    cartId: string,
    productId: string,
    quantity = 1,
    combinationId?: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { stock: true, combinations: { include: { stock: true } } },
    });

    if (!product || !product.active) {
      throw new NotFoundException('Product not found or not available');
    }
    if (product.combinations.length > 0 && !combinationId) {
      throw new BadRequestException(
        'This product requires a combination selection',
      );
    }

    const combination = combinationId
      ? product.combinations.find((c) => c.id === combinationId)
      : null;
    if (combinationId && !combination) {
      throw new NotFoundException('Combination not found');
    }

    const stock = combination?.stock || product.stock;
    if (
      stock &&
      stock.outOfStockBehavior === 'deny' &&
      stock.quantity < quantity
    ) {
      throw new BadRequestException(
        `Only ${stock.quantity} items available in stock`,
      );
    }

    const include = { product: true, combination: true };
    const updateRes = await this.prisma.cartItem.updateMany({
      where: { cartId, productId, combinationId: combinationId || null },
      data: { quantity: { increment: quantity } },
    });

    if (updateRes.count > 0) {
      const item = await this.prisma.cartItem.findFirst({
        where: { cartId, productId, combinationId: combinationId || null },
        include,
      });
      if (item) return item;
    }

    try {
      return await this.prisma.cartItem.create({
        data: { cartId, productId, combinationId, quantity },
        include,
      });
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        await this.prisma.cartItem.updateMany({
          where: { cartId, productId, combinationId: combinationId || null },
          data: { quantity: { increment: quantity } },
        });
        const item = await this.prisma.cartItem.findFirst({
          where: { cartId, productId, combinationId: combinationId || null },
          include,
        });
        if (item) return item;
      }
      throw e;
    }
  }

  async updateCartItemQuantity(cartItemId: string, quantity: number) {
    if (quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        product: { include: { stock: true } },
        combination: { include: { stock: true } },
      },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const stock = item.combination?.stock || item.product.stock;
    if (
      stock &&
      stock.outOfStockBehavior === 'deny' &&
      stock.quantity < quantity
    ) {
      throw new BadRequestException(
        `Only ${stock.quantity} items available in stock`,
      );
    }

    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { product: true, combination: true },
    });
  }

  async removeCartItem(cartItemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id: cartItemId },
      include: { product: true, combination: true },
    });
  }

  async clearCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
    return this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });
  }

  async getCartWithTotals(cartId: string, countryId?: string) {
    return this.cartPricingService.getCartWithTotals(cartId, countryId);
  }

  async mergeGuestCart(sessionId: string, customerId: string) {
    return this.cartMergeService.mergeGuestCart(sessionId, customerId);
  }
  async applyCoupon(cartId: string, code: string, countryId?: string) {
    return this.cartCouponService.applyCoupon(cartId, code, countryId);
  }

  async removeCoupon(cartId: string, countryId?: string) {
    return this.cartCouponService.removeCoupon(cartId, countryId);
  }

  async reserveStock(cartId: string, ttlSeconds?: number) {
    return this.cartStockReservationService.reserveCartStock(
      cartId,
      ttlSeconds,
    );
  }

  async releaseReservedStock(cartId: string) {
    return this.cartStockReservationService.releaseCartStock(cartId);
  }
}
