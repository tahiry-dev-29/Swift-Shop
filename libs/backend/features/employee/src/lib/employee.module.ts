import { Module } from '@nestjs/common';
import { DataAccessPrismaModule } from '@swift-shop/data-access-prisma';
import { AuthModule } from '@swift-shop/backend/auth';
import { EmployeeRoleAssignmentService } from './employee-role-assignment.service';
import { EmployeeService } from './employee.service';
import { EmployeeAuthAuditService } from './employee-auth-audit.service';
import { EmployeeAuthFlowService } from './employee-auth-flow.service';
import { EmployeeAuthResolver } from './employee-auth.resolver';
import { EmployeeResolver } from './employee.resolver';
import { EmployeeTwoFactorFlowService } from './employee-two-factor-flow.service';
import { RolePermissionService } from './role-permission.service';
import { RoleService } from './role.service';
import { RoleResolver } from './role.resolver';

@Module({
  imports: [DataAccessPrismaModule, AuthModule],
  providers: [
    EmployeeService,
    EmployeeAuthAuditService,
    EmployeeAuthFlowService,
    EmployeeAuthResolver,
    EmployeeResolver,
    EmployeeTwoFactorFlowService,
    RoleService,
    RolePermissionService,
    EmployeeRoleAssignmentService,
    RoleResolver,
  ],
  exports: [EmployeeService, RoleService],
})
export class EmployeeModule {}
