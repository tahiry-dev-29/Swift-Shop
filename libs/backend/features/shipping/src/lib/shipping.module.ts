import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { AuthModule } from '@swift-shop/backend/auth';
import { CarrierAdapterRegistry } from './carrier-adapter.registry';
import { ShipmentService } from './shipment.service';
import { ShippingCalculationService } from './shipping-calculation.service';
import { ShippingResolver } from './shipping.resolver';
import { CourierChatService } from './courier-chat.service';
import { CourierChatGateway } from './courier-chat.gateway';

@Module({
  imports: [DataAccessPrismaModule, AuthModule],
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
