import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { PriceCalculationService } from './price-calculation.service';
import { PricingResolver } from './pricing.resolver';
import { CountryResolver } from './country.resolver';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [PriceCalculationService, PricingResolver, CountryResolver],
  exports: [PriceCalculationService],
})
export class PricingModule {}
