import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';

@Injectable()
export class EmailTemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.emailTemplate.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; subject: string; bodyHtml: string }) {
    return this.prisma.emailTemplate.create({
      data,
    });
  }

  async update(
    id: string,
    data: { name?: string; subject?: string; bodyHtml?: string },
  ) {
    return this.prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.emailTemplate.delete({
      where: { id },
    });
  }
}
