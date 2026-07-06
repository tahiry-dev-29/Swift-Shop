import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { CarrierAdapterRegistry } from './carrier-adapter.registry';
import { ShipmentService } from './shipment.service';
import { ShippingCalculationService } from './shipping-calculation.service';
import { ShippingResolver } from './shipping.resolver';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [
    CarrierAdapterRegistry,
    ShipmentService,
    ShippingCalculationService,
    ShippingResolver,
  ],
  exports: [ShipmentService, ShippingCalculationService],
})
export class ShippingModule {}
