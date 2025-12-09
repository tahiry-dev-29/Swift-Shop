import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { AuthService } from '@dima-new/backend/auth';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  async findAll() {
    return this.prisma.employee.findMany({
      orderBy: { id: 'asc' },
      include: { role: true },
    });
  }

  async findById(id: number) {
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
    roleId?: number;
  }) {
    const hashedPassword = await this.authService.hashPassword(data.password);

    
    let roleId = data.roleId;
    if (!roleId) {
       const salesRole = await this.prisma.role.findFirst({ where: { name: 'SALES' } });
       roleId = salesRole?.id;
    }
    if (!roleId) throw new Error('Role ID required or SALES role missing');

    return this.prisma.employee.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstname: data.firstname,
        lastname: data.lastname,
        role: { connect: { id: roleId } },
      },
      include: { role: true },
    });
  }

  async update(id: number, data: {
    firstname?: string;
    lastname?: string;
    roleId?: number;
    active?: boolean;
  }) {
    const updateData: any = {
      ...data,
    };
    if (data.roleId) {
      updateData.role = { connect: { id: data.roleId } };
      delete updateData.roleId;
    }

    return this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });
  }

  async updateLastConnection(id: number) {
    return this.prisma.employee.update({
      where: { id },
      data: { lastConnectionDate: new Date() },
    });
  }

  async delete(id: number) {
    return this.prisma.employee.delete({
      where: { id },
    });
  }
}
