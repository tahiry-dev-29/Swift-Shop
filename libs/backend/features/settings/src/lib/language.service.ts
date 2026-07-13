import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';

@Injectable()
export class LanguageService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.language.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.language.findUnique({ where: { id } });
  }

  async findActive() {
    return this.prisma.language.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findDefault() {
    return this.prisma.language.findFirst({
      where: { isDefault: true },
    });
  }

  async create(data: {
    name: string;
    code: string;
    locale: string;
    isDefault?: boolean;
    active?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.language.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.language.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      locale?: string;
      isDefault?: boolean;
      active?: boolean;
    },
  ) {
    if (data.isDefault) {
      await this.prisma.language.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.language.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const language = await this.prisma.language.findUnique({ where: { id } });
    if (!language) throw new NotFoundException('Language not found');
    if (language.isDefault) throw new Error('Cannot delete default language');

    return this.prisma.language.delete({
      where: { id },
    });
  }

  async setDefault(id: string) {
    return this.update(id, { isDefault: true });
  }
}
