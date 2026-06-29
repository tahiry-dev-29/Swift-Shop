import { Module } from '@nestjs/common';
import { CartService } from './cart-service';
import { CartMergeService } from './cart-merge.service';
import { CartPricingService } from './cart-pricing.service';
import { CartCouponService } from './cart-coupon.service';
import { CartStockReservationService } from './cart-stock-reservation.service';
import { AbandonedCartRecoveryService } from './abandoned-cart-recovery.service';
import { CartResolver } from './cart-resolver';
import { PricingModule } from '@dima-new/backend/pricing';
import { AuthModule } from '@dima-new/backend/auth';

import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';

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
