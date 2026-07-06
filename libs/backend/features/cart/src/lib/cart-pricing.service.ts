import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { PriceCalculationService } from '@swift-shop/backend/pricing';
import { PriceResult } from '@swift-shop/models';
import { CartType } from './dto/cart-types';

function toNum(val: unknown) {
  return val ? Number(val.toString()) : 0;
}

type PricedCartItem = {
  product: {
    price: unknown;
    wholesalePrice: unknown;
    weight: unknown;
    width: unknown;
    height: unknown;
    depth: unknown;
  };
  combination?: {
    priceImpact: unknown;
    weightImpact: unknown;
  } | null;
  quantity: number;
};

@Injectable()
export class CartPricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: PriceCalculationService,
  ) {}

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
        coupon: true,
        customer: { include: { country: true, group: true } },
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const finalCountryId = await this.resolveCountryId(
      countryId || cart.customer?.countryId,
    );
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
        return this.withComputedPrices(item, priceDetail);
      }),
    );

    const totalHT = itemsWithPrices.reduce(
      (sum, item) =>
        sum +
        toNum(item.priceDetail?.priceHT ?? item.product.price) * item.quantity,
      0,
    );
    const totalTax = itemsWithPrices.reduce(
      (sum, item) =>
        sum + toNum(item.priceDetail?.taxAmount ?? 0) * item.quantity,
      0,
    );
    const totalTTCBeforeDiscount = itemsWithPrices.reduce(
      (sum, item) =>
        sum +
        toNum(item.priceDetail?.priceTTC ?? item.product.price) * item.quantity,
      0,
    );
    const discountTotal = Math.min(
      totalTTCBeforeDiscount,
      toNum(cart.coupon?.discountAmount ?? 0),
    );

    return {
      id: cart.id,
      customerId: cart.customerId ?? undefined,
      sessionId: cart.sessionId ?? undefined,
      items: itemsWithPrices,
      couponCode: cart.coupon?.code,
      discountTotal,
      totalHT,
      totalTax,
      totalTTC: Math.max(0, totalTTCBeforeDiscount - discountTotal),
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      dateAdd: cart.dateAdd,
      dateUpd: cart.dateUpd,
    };
  }

  private async resolveCountryId(countryId?: string | null) {
    if (countryId) {
      return countryId;
    }
    const defaultCountry = await this.prisma.country.findFirst({
      where: { isoCode: 'FR' },
    });
    return defaultCountry?.id;
  }

  private withComputedPrices<T extends PricedCartItem>(
    item: T,
    priceDetail: PriceResult | null,
  ) {
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
  }
}
