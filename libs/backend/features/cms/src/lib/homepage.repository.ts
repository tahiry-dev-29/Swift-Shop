import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { Prisma } from '@swift-shop/prisma-client';

@Injectable()
export class HomepageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.HomepageBlockCreateInput) {
    return this.prisma.homepageBlock.create({ data });
  }

  async findById(id: string) {
    return this.prisma.homepageBlock.findUnique({
      where: { id },
    });
  }

  async findMany(options?: { activeOnly?: boolean }) {
    return this.prisma.homepageBlock.findMany({
      where: options?.activeOnly ? { active: true } : undefined,
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, data: Prisma.HomepageBlockUpdateInput) {
    return this.prisma.homepageBlock.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.homepageBlock.delete({
      where: { id },
    });
  }

  async updatePositions(items: { id: string; position: number }[]) {
    return this.prisma.$transaction(
      items.map((item) =>
        this.prisma.homepageBlock.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    );
  }
}
