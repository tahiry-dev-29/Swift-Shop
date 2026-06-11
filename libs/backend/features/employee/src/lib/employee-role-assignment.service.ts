import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { mapRole } from './role-utils';

@Injectable()
export class EmployeeRoleAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async assignRolesToEmployee(employeeId: string, roleIds: string[]) {
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
    ]);
    return this.getEmployeeWithRoles(employeeId);
  }

  async revokeRolesFromEmployee(employeeId: string, roleIds: string[]) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new Error('Employee not found');
    if (roleIds.includes(employee.roleId)) {
      throw new Error('Cannot revoke employee primary role');
    }

    await this.prisma.employeeRole.deleteMany({
      where: { employeeId, roleId: { in: roleIds } },
    });
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
}
