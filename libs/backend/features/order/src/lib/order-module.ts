import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order-service';
import { OrderCreationService } from './order-creation.service';
import { OrderActionService } from './order-action.service';
import { OrderResolver } from './order-resolver';
import { CartModule } from '@dima-new/backend/cart';

import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';

@Module({
  imports: [DataAccessPrismaModule, forwardRef(() => CartModule)],
  providers: [
    OrderService,
    OrderCreationService,
    OrderActionService,
    OrderResolver,
  ],
  exports: [OrderService, OrderCreationService, OrderActionService],
})
export class OrderModule {}
