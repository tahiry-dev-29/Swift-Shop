import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { PriceCalculationService } from '@dima-new/backend/pricing';
import { CartType } from './dto/cart-types';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: PriceCalculationService,
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

    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId, productId, combinationId: combinationId || null },
    });

    const include = { product: true, combination: true };
    return existingItem
      ? this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
          include,
        })
      : this.prisma.cartItem.create({
          data: { cartId, productId, combinationId, quantity },
          include,
        });
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

  async getCartWithTotals(
    cartId: string,
    countryId?: string,
  ): Promise<CartType> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: { include: { stock: true } },
            combination: { include: { stock: true } },
          },
        },
        customer: { include: { country: true, group: true } },
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const taxCountryId = countryId || cart.customer?.countryId;
    const defaultCountry = await this.prisma.country.findFirst({
      where: { isoCode: 'FR' },
    });
    const finalCountryId = taxCountryId || defaultCountry?.id;

    const toNum = (val: unknown) => (val ? Number(val.toString()) : 0);

    const itemsWithPrices = await Promise.all(
      cart.items.map(async (item) => {
        const priceDetail = finalCountryId
          ? await this.priceService.calculatePrice({
              productId: item.productId,
              countryId: finalCountryId,
              combinationId: item.combinationId || undefined,
              customerId: cart.customerId || undefined,
              quantity: item.quantity,
            })
          : null;

        return {
          ...item,
          product: {
            ...item.product,
            price: toNum(item.product.price),
            wholesalePrice: toNum(item.product.wholesalePrice),
            weight: toNum(item.product.weight),
            width: toNum(item.product.width),
            height: toNum(item.product.height),
            depth: toNum(item.product.depth),
          },
          combination: item.combination
            ? {
                ...item.combination,
                priceImpact: toNum(item.combination.priceImpact),
                weightImpact: toNum(item.combination.weightImpact),
              }
            : undefined,
          priceDetail: priceDetail ?? undefined,
          lineTotal: priceDetail
            ? toNum(priceDetail.priceTTC) * item.quantity
            : toNum(item.product.price) * item.quantity,
        };
      }),
    );

    return {
      id: cart.id,
      customerId: cart.customerId ?? undefined,
      sessionId: cart.sessionId ?? undefined,
      items: itemsWithPrices,
      totalHT: itemsWithPrices.reduce(
        (sum, item) =>
          sum +
          toNum(item.priceDetail?.priceHT ?? item.product.price) *
            item.quantity,
        0,
      ),
      totalTax: itemsWithPrices.reduce(
        (sum, item) =>
          sum + toNum(item.priceDetail?.taxAmount ?? 0) * item.quantity,
        0,
      ),
      totalTTC: itemsWithPrices.reduce(
        (sum, item) =>
          sum +
          toNum(item.priceDetail?.priceTTC ?? item.product.price) *
            item.quantity,
        0,
      ),
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      dateAdd: cart.dateAdd,
      dateUpd: cart.dateUpd,
    };
  }

  async mergeGuestCart(sessionId: string, customerId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(customerId);
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

    for (const item of guestCart.items) {
      const existing = await this.prisma.cartItem.findFirst({
        where: {
          cartId: customerCart.id,
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
        await this.prisma.cartItem.create({
          data: {
            cartId: customerCart.id,
            productId: item.productId,
            combinationId: item.combinationId,
            quantity: item.quantity,
          },
        });
      }
    }

    await this.prisma.cart.delete({ where: { id: guestCart.id } });
    return this.prisma.cart.findUnique({
      where: { id: customerCart.id },
      include: { items: { include: { product: true, combination: true } } },
    });
  }
}
