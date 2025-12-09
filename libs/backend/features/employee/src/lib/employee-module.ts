import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@dima-new/data-access-prisma';
import { AuthModule } from '@dima-new/backend/auth';
import { EmployeeService } from './employee-service';
import { EmployeeResolver } from './employee-resolver';
import { RoleService } from './role-service';
import { RoleResolver } from './role-resolver';

@Module({
  imports: [DataAccessPrismaModule, AuthModule],
  providers: [EmployeeService, EmployeeResolver, RoleService, RoleResolver],
  exports: [EmployeeService, RoleService],
})
export class EmployeeModule {}
