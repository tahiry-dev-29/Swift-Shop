import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { AuthService } from '@dima-new/backend/auth';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findAll() {
    return this.prisma.employee.findMany({
      orderBy: { id: 'asc' },
      include: { role: true },
    });
  }

  async findById(id: string) {
    return this.prisma.employee.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.employee.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async create(data: {
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    roleId?: string;
  }) {
    const hashedPassword = await this.authService.hashPassword(data.password);

    let roleId = data.roleId;
    if (!roleId) {
      const defaultRole = await this.prisma.role.findFirst({
        where: {
          OR: [{ slug: 'support_agent' }, { name: 'SALES' }],
          deletedAt: null,
        },
        orderBy: { name: 'asc' },
      });
      roleId = defaultRole?.id;
    }
    if (!roleId) throw new Error('Role ID required or default role missing');

    return this.prisma.employee.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstname: data.firstname,
        lastname: data.lastname,
        role: { connect: { id: roleId } },
        roles: {
          create: {
            role: { connect: { id: roleId } },
          },
        },
      },
      include: { role: true },
    });
  }

  async update(
    id: string,
    data: {
      firstname?: string;
      lastname?: string;
      roleId?: string;
      active?: boolean;
      twoFactorSecret?: string | null;
      twoFactorEnabled?: boolean;
      forcePasswordReset?: boolean;
    },
  ) {
    const { roleId, ...employeeData } = data;
    const updateData: {
      firstname?: string;
      lastname?: string;
      active?: boolean;
      twoFactorSecret?: string | null;
      twoFactorEnabled?: boolean;
      forcePasswordReset?: boolean;
      role?: { connect: { id: string } };
    } = {
      ...employeeData,
    };
    if (roleId) {
      updateData.role = { connect: { id: roleId } };
    }

    return this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });
  }

  async updateLastConnection(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { lastConnectionDate: new Date() },
    });
  }

  async delete(id: string) {
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}
