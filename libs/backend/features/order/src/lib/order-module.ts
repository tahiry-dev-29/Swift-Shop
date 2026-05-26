import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order-service';
import { OrderResolver } from './order-resolver';
import { CartModule } from '@dima-new/backend/cart';

import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';

@Module({
  imports: [DataAccessPrismaModule, forwardRef(() => CartModule)], 
  providers: [OrderService, OrderResolver],
  exports: [OrderService],
})
export class OrderModule {}
