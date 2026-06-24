import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.store.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findActive() {
    return this.prisma.store.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findDefault() {
    return this.prisma.store.findFirst({
      where: { isDefault: true },
    });
  }

  async create(data: {
    name: string;
    url?: string;
    isDefault?: boolean;
    active?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.store.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.store.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      url?: string;
      isDefault?: boolean;
      active?: boolean;
    },
  ) {
    if (data.isDefault) {
      await this.prisma.store.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.store.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');
    if (store.isDefault) throw new Error('Cannot delete default store');

    return this.prisma.store.delete({
      where: { id },
    });
  }
}
