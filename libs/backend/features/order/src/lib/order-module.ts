import { Module, forwardRef } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { OrderService } from './order-service';
import { OrderCreationService } from './order-creation.service';
import { OrderActionService } from './order-action.service';
import { GuestCheckoutService } from './guest-checkout.service';
import { OrderAddressSnapshotService } from './order-address-snapshot.service';
import { OrderExportService } from './order-export.service';
import { OrderInvoiceService } from './order-invoice.service';
import { OrderResolver } from './order-resolver';
import { CartModule } from '@swift-shop/backend/cart';

import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';

@Module({
  imports: [DataAccessPrismaModule, forwardRef(() => CartModule)],
  providers: [
    OrderService,
    OrderCreationService,
    OrderActionService,
    GuestCheckoutService,
    OrderAddressSnapshotService,
    OrderExportService,
    OrderInvoiceService,
    OrderResolver,
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(),
    },
  ],
  exports: [OrderService, OrderCreationService, OrderActionService, 'PUB_SUB'],
})
export class OrderModule {}
