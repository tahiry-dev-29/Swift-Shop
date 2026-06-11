import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  mapPermission,
  permissionActions,
  permissionResources,
  permissionSlug,
} from './role-utils';
import { RoleService } from './role.service';

@Injectable()
export class RolePermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
  ) {}

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    await this.ensureMutableRole(roleId);
    await this.prisma.$transaction(
      permissionIds.map((permissionId) =>
        this.prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId },
        }),
      ),
    );
    return this.roleService.findByIdOrThrow(roleId);
  }

  async revokePermissionsFromRole(roleId: string, permissionIds: string[]) {
    await this.ensureMutableRole(roleId);
    await this.prisma.rolePermission.deleteMany({
      where: { roleId, permissionId: { in: permissionIds } },
    });
    return this.roleService.findByIdOrThrow(roleId);
  }

  async getPermissionsMatrix() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    return permissionResources.map((resource) => ({
      resource,
      permissions: permissionActions.map((action) => ({
        resource,
        action,
        permission: permissions.find(
          (permission) =>
            permission.resource === resource && permission.action === action,
        ),
      })),
    }));
  }

  async getEffectivePermissions(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        role: {
          include: { rolePermissions: { include: { permission: true } } },
        },
        roles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!employee) throw new Error('Employee not found');

    const permissionsBySlug = new Map(
      employee.role.rolePermissions.map((item) => [
        item.permission.slug,
        mapPermission(item.permission),
      ]),
    );
    for (const employeeRole of employee.roles) {
      for (const item of employeeRole.role.rolePermissions) {
        permissionsBySlug.set(
          item.permission.slug,
          mapPermission(item.permission),
        );
      }
    }
    return Array.from(permissionsBySlug.values()).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    );
  }

  async hasPermission(employeeId: string, requiredPermission: string) {
    const permissions = await this.getEffectivePermissions(employeeId);
    return permissions.some(
      (permission) =>
        permission.slug === requiredPermission ||
        permissionSlug(permission.resource, permission.action) ===
          requiredPermission,
    );
  }

  private async ensureMutableRole(roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, deletedAt: null },
    });
    if (!role) throw new Error('Role not found');
    if (role.isSystem && role.slug === 'super_admin') {
      throw new Error('SuperAdmin permissions cannot be modified');
    }
  }
}
