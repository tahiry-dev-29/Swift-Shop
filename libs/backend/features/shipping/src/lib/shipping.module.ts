import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { CarrierAdapterRegistry } from './carrier-adapter.registry';
import { ShipmentService } from './shipment.service';
import { ShippingCalculationService } from './shipping-calculation.service';
import { ShippingResolver } from './shipping.resolver';
import { CourierChatService } from './courier-chat.service';
import { CourierChatGateway } from './courier-chat.gateway';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [
    CarrierAdapterRegistry,
    ShipmentService,
    ShippingCalculationService,
    ShippingResolver,
    CourierChatService,
    CourierChatGateway,
  ],
  exports: [ShipmentService, ShippingCalculationService, CourierChatService],
})
export class ShippingModule {}
