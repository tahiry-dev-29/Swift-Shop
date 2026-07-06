import { Injectable } from '@nestjs/common';
import { RedisService } from '@swift-shop/backend/auth';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { mapRole } from './role-utils';

@Injectable()
export class EmployeeRoleAssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async assignRolesToEmployee(
    employeeId: string,
    roleIds: string[],
    actorId?: string,
  ) {
    const [primaryRoleId] = roleIds;
    await this.prisma.$transaction([
      ...(primaryRoleId
        ? [
            this.prisma.employee.update({
              where: { id: employeeId },
              data: { roleId: primaryRoleId },
            }),
          ]
        : []),
      ...roleIds.map((roleId) =>
        this.prisma.employeeRole.upsert({
          where: { employeeId_roleId: { employeeId, roleId } },
          update: {},
          create: { employeeId, roleId },
        }),
      ),
      ...roleIds.map((roleId) =>
        this.prisma.permissionAuditLog.create({
          data: {
            action: 'role.assign',
            actorId,
            employeeId,
            roleId,
          },
        }),
      ),
    ]);
    await this.invalidateEmployeePermissionCache(employeeId);
    return this.getEmployeeWithRoles(employeeId);
  }

  async revokeRolesFromEmployee(
    employeeId: string,
    roleIds: string[],
    actorId?: string,
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new Error('Employee not found');
    if (roleIds.includes(employee.roleId)) {
      throw new Error('Cannot revoke employee primary role');
    }

    await this.prisma.$transaction([
      this.prisma.employeeRole.deleteMany({
        where: { employeeId, roleId: { in: roleIds } },
      }),
      ...roleIds.map((roleId) =>
        this.prisma.permissionAuditLog.create({
          data: {
            action: 'role.revoke',
            actorId,
            employeeId,
            roleId,
          },
        }),
      ),
    ]);
    await this.invalidateEmployeePermissionCache(employeeId);
    return this.getEmployeeWithRoles(employeeId);
  }

  async grantTemporaryRoleElevation(
    employeeId: string,
    roleId: string,
    expiresAt: Date,
    actorId?: string,
    reason?: string,
  ) {
    if (expiresAt <= new Date()) {
      throw new Error('Temporary role elevation must expire in the future');
    }

    await this.prisma.$transaction([
      this.prisma.temporaryRoleElevation.create({
        data: { employeeId, roleId, actorId, reason, expiresAt },
      }),
      this.prisma.permissionAuditLog.create({
        data: {
          action: 'role.temporary_elevation.grant',
          actorId,
          employeeId,
          roleId,
          metadata: { expiresAt, reason },
        },
      }),
    ]);
    await this.invalidateEmployeePermissionCache(employeeId);
    return this.getEmployeeWithRoles(employeeId);
  }

  async revokeTemporaryRoleElevation(elevationId: string, actorId?: string) {
    const elevation = await this.prisma.temporaryRoleElevation.update({
      where: { id: elevationId },
      data: { revokedAt: new Date() },
    });
    await this.prisma.permissionAuditLog.create({
      data: {
        action: 'role.temporary_elevation.revoke',
        actorId,
        employeeId: elevation.employeeId,
        roleId: elevation.roleId,
        metadata: { elevationId },
      },
    });
    await this.invalidateEmployeePermissionCache(elevation.employeeId);
    return this.getEmployeeWithRoles(elevation.employeeId);
  }

  async assignStoreBranchesToEmployee(
    employeeId: string,
    branchIds: string[],
    actorId?: string,
  ) {
    await this.prisma.$transaction([
      ...branchIds.map((branchId) =>
        this.prisma.employeeStoreBranch.upsert({
          where: { employeeId_branchId: { employeeId, branchId } },
          update: {},
          create: { employeeId, branchId },
        }),
      ),
      this.prisma.permissionAuditLog.create({
        data: {
          action: 'store_branch.assign',
          actorId,
          employeeId,
          metadata: { branchIds },
        },
      }),
    ]);
    return this.getEmployeeWithRoles(employeeId);
  }

  async revokeStoreBranchesFromEmployee(
    employeeId: string,
    branchIds: string[],
    actorId?: string,
  ) {
    await this.prisma.$transaction([
      this.prisma.employeeStoreBranch.deleteMany({
        where: { employeeId, branchId: { in: branchIds } },
      }),
      this.prisma.permissionAuditLog.create({
        data: {
          action: 'store_branch.revoke',
          actorId,
          employeeId,
          metadata: { branchIds },
        },
      }),
    ]);
    return this.getEmployeeWithRoles(employeeId);
  }

  private async getEmployeeWithRoles(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { role: true, roles: { include: { role: true } } },
    });
    if (!employee) throw new Error('Employee not found');
    return {
      ...employee,
      role: mapRole(employee.role),
      roles: employee.roles.map((item) => mapRole(item.role)),
    };
  }

  private async invalidateEmployeePermissionCache(employeeId: string) {
    await this.redisService.delete(`permissions:employee:${employeeId}`);
  }
}
