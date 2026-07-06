import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartPricingService } from './cart-pricing.service';

const COUPON_RULES: Record<
  string,
  { discountType: 'percent' | 'fixed'; discountValue: number; expiresAt?: Date }
> = {
  WELCOME10: { discountType: 'percent', discountValue: 10 },
  FREESHIP: { discountType: 'fixed', discountValue: 5 },
};

@Injectable()
export class CartCouponService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartPricingService: CartPricingService,
  ) {}

  async applyCoupon(cartId: string, code: string, countryId?: string) {
    const normalizedCode = code.trim().toUpperCase();
    const rule = COUPON_RULES[normalizedCode];

    if (!rule) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (rule.expiresAt && rule.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Coupon has expired');
    }

    const cart = await this.cartPricingService.getCartWithTotals(
      cartId,
      countryId,
    );
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartTotal = Number(cart.totalTTC ?? 0);
    const discountAmount =
      rule.discountType === 'percent'
        ? Math.min(cartTotal, (cartTotal * rule.discountValue) / 100)
        : Math.min(cartTotal, rule.discountValue);

    await this.prisma.cartCoupon.upsert({
      where: { cartId },
      create: {
        cartId,
        code: normalizedCode,
        discountType: rule.discountType,
        discountValue: rule.discountValue,
        discountAmount,
        expiresAt: rule.expiresAt,
      },
      update: {
        code: normalizedCode,
        discountType: rule.discountType,
        discountValue: rule.discountValue,
        discountAmount,
        expiresAt: rule.expiresAt,
      },
    });

    return this.cartPricingService.getCartWithTotals(cartId, countryId);
  }

  async removeCoupon(cartId: string, countryId?: string) {
    await this.prisma.cartCoupon.deleteMany({ where: { cartId } });
    return this.cartPricingService.getCartWithTotals(cartId, countryId);
  }
}
