import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; description?: string }) {
    return this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        isSystem: false,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    const role = await this.findById(id);
    if (!role) throw new Error('Role not found');

    if (role.isSystem) {
      if (data.name && data.name !== role.name) {
        throw new Error('Cannot rename system roles');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const role = await this.findById(id);
    if (!role) throw new Error('Role not found');

    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
