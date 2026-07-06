import { Module } from '@nestjs/common';
import { CartService } from './cart-service';
import { CartMergeService } from './cart-merge.service';
import { CartPricingService } from './cart-pricing.service';
import { CartCouponService } from './cart-coupon.service';
import { CartStockReservationService } from './cart-stock-reservation.service';
import { AbandonedCartRecoveryService } from './abandoned-cart-recovery.service';
import { CartResolver } from './cart-resolver';
import { PricingModule } from '@swift-shop/backend/pricing';
import { AuthModule } from '@swift-shop/backend/auth';

import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';

@Module({
  imports: [DataAccessPrismaModule, PricingModule, AuthModule],
  providers: [
    CartService,
    CartMergeService,
    CartPricingService,
    CartCouponService,
    CartStockReservationService,
    AbandonedCartRecoveryService,
    CartResolver,
  ],
  exports: [CartService],
})
export class CartModule {}
