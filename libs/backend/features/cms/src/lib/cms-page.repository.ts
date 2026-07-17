import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { Prisma } from '@swift-shop/prisma-client';

@Injectable()
export class CmsPageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CmsPageCreateInput) {
    return this.prisma.cmsPage.create({ data });
  }

  async findById(id: string) {
    return this.prisma.cmsPage.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.cmsPage.findUnique({
      where: { slug },
    });
  }

  async findMany(options?: { activeOnly?: boolean }) {
    return this.prisma.cmsPage.findMany({
      where: options?.activeOnly ? { active: true } : undefined,
      orderBy: { dateAdd: 'desc' },
    });
  }

  async update(id: string, data: Prisma.CmsPageUpdateInput) {
    return this.prisma.cmsPage.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.cmsPage.delete({
      where: { id },
    });
  }

  async countBySlug(slug: string, excludeId?: string) {
    return this.prisma.cmsPage.count({
      where: {
        slug,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  }
}
