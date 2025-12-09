import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthModule } from '@dima-new/backend/auth';
import { CustomerService } from './customer.service';
import { CustomerResolver } from './customer.resolver';

@Module({
  imports: [DataAccessPrismaModule, AuthModule],
  providers: [CustomerService, CustomerResolver],
  exports: [CustomerService],
})
export class CustomerModule {}
