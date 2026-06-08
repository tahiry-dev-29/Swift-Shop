import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';

@Injectable()
export class CustomerGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customerGroup.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.customerGroup.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return this.prisma.customerGroup.findFirst({
      where: { name },
    });
  }

  async create(data: {
    name: string;
    reduction?: number;
    showPrices?: boolean;
  }) {
    return this.prisma.customerGroup.create({
      data: {
        name: data.name,
        reduction: data.reduction ?? 0,
        showPrices: data.showPrices ?? true,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; reduction?: number; showPrices?: boolean },
  ) {
    return this.prisma.customerGroup.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.customerGroup.delete({
      where: { id },
    });
  }
}
