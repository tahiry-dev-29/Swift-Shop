import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { AuthModule } from '@swift-shop/backend/auth';
import { CustomerGroupService } from './customer-group.service';
import { CustomerGroupResolver } from './customer-group.resolver';

@Module({
  imports: [DataAccessPrismaModule, AuthModule],
  providers: [CustomerGroupService, CustomerGroupResolver],
  exports: [CustomerGroupService],
})
export class CustomerGroupModule {}
