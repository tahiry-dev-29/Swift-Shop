import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { AuthModule } from '@swift-shop/backend/auth';
import { PriceCalculationService } from './price-calculation.service';
import { PriceQueryService } from './price-query.service';
import { PricingResolver } from './pricing.resolver';
import { CountryResolver } from './country.resolver';

@Module({
  imports: [DataAccessPrismaModule, AuthModule],
  providers: [
    PriceQueryService,
    PriceCalculationService,
    PricingResolver,
    CountryResolver,
  ],
  exports: [PriceCalculationService],
})
export class PricingModule {}
