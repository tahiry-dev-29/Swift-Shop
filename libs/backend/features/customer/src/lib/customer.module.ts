import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthModule } from '@dima-new/backend/auth';
import { CustomerService } from './customer.service';
import { CustomerAuthResolver } from './customer-auth.resolver';
import { CustomerMagicLinkResolver } from './customer-magic-link.resolver';
import { CustomerOAuthResolver } from './customer-oauth.resolver';
import { CustomerResolver } from './customer.resolver';

import { CartModule } from '@dima-new/backend/cart';

@Module({
  imports: [DataAccessPrismaModule, AuthModule, CartModule],
  providers: [
    CustomerService,
    CustomerAuthResolver,
    CustomerMagicLinkResolver,
    CustomerOAuthResolver,
    CustomerResolver,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}
