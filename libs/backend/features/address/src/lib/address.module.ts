import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AddressService } from './address.service';
import { AddressResolver } from './address.resolver';

@Module({
  imports: [DataAccessPrismaModule],
  providers: [AddressService, AddressResolver],
  exports: [AddressService, AddressResolver],
})
export class AddressModule {}
