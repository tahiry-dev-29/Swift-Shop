import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { Prisma } from '@swift-shop/prisma-client';

@Injectable()
export class BannerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.BannerCreateInput) {
    return this.prisma.banner.create({ data });
  }

  async findById(id: string) {
    return this.prisma.banner.findUnique({
      where: { id },
    });
  }

  async findMany(options?: { activeOnly?: boolean; currentDate?: Date }) {
    const where: Prisma.BannerWhereInput = {};

    if (options?.activeOnly) {
      where.active = true;

      if (options.currentDate) {
        where.AND = [
          {
            OR: [
              { dateFrom: null },
              { dateFrom: { lte: options.currentDate } },
            ],
          },
          {
            OR: [{ dateTo: null }, { dateTo: { gte: options.currentDate } }],
          },
        ];
      }
    }

    return this.prisma.banner.findMany({
      where,
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, data: Prisma.BannerUpdateInput) {
    return this.prisma.banner.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
