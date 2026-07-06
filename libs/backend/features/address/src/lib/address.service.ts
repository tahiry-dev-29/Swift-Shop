import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CreateAddressInput, UpdateAddressInput } from './dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.address.findMany({
      where: { deleted: false },
      orderBy: { id: 'desc' },
    });
  }

  async findByCustomer(customerId: string) {
    return this.prisma.address.findMany({
      where: { customerId, deleted: false },
      orderBy: { id: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.address.findUnique({
      where: { id },
    });
  }

  async create(customerId: string, input: CreateAddressInput) {
    return this.prisma.address.create({
      data: {
        ...input,
        customerId,
      },
    });
  }

  async update(id: string, input: UpdateAddressInput) {
    return this.prisma.address.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string) {
    return this.prisma.address.update({
      where: { id },
      data: { deleted: true },
    });
  }
}
