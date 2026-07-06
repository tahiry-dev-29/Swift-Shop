import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { PaymentAdapterRegistry } from './payment-adapter.registry';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';
import { PaymentWebhookSecurityService } from './payment-webhook-security.service';

@Module({
  imports: [ConfigModule, DataAccessPrismaModule],
  providers: [
    PaymentAdapterRegistry,
    PaymentService,
    PaymentWebhookSecurityService,
    PaymentResolver,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
