import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthModule } from '@dima-new/backend/auth';
import { CustomerGroupService } from './customer-group-service';
import { CustomerGroupResolver } from './customer-group-resolver';

@Module({
  imports: [DataAccessPrismaModule, AuthModule],
  providers: [CustomerGroupService, CustomerGroupResolver],
  exports: [CustomerGroupService],
})
export class CustomerGroupModule {}
