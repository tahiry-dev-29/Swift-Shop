import { Module } from '@nestjs/common';
import { CartService } from './cart-service';
import { CartResolver } from './cart-resolver';
import { PricingModule } from '@dima-new/backend/pricing';

import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';

@Module({
  imports: [DataAccessPrismaModule, PricingModule],
  providers: [CartService, CartResolver],
  exports: [CartService],
})
export class CartModule {}
