import { Module } from '@nestjs/common';
import { CartService } from './cart-service';
import { CartResolver } from './cart-resolver';
import { PricingModule } from '@dima-new/backend/pricing';

@Module({
  imports: [PricingModule],
  providers: [CartService, CartResolver],
  exports: [CartService],
})
export class CartModule {}
