import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { AuthModule } from '@swift-shop/backend/auth';
import { CustomerService } from './customer.service';
import { CustomerAuthResolver } from './customer-auth.resolver';
import { CustomerMagicLinkResolver } from './customer-magic-link.resolver';
import { CustomerOAuthResolver } from './customer-oauth.resolver';
import { CustomerResolver } from './customer.resolver';
import { CustomerRoleService } from './customer-role.service';
import { CustomerRoleResolver } from './customer-role.resolver';

import { CartModule } from '@swift-shop/backend/cart';

@Module({
  imports: [DataAccessPrismaModule, AuthModule, CartModule],
  providers: [
    CustomerService,
    CustomerAuthResolver,
    CustomerMagicLinkResolver,
    CustomerOAuthResolver,
    CustomerResolver,
    CustomerRoleService,
    CustomerRoleResolver,
  ],
  exports: [CustomerService, CustomerRoleService],
})
export class CustomerModule {}
