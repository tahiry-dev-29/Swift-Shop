import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.currency.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.currency.findUnique({ where: { id } });
  }

  async findActive() {
    return this.prisma.currency.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findDefault() {
    return this.prisma.currency.findFirst({
      where: { isDefault: true },
    });
  }

  async create(data: {
    name: string;
    code: string;
    symbol: string;
    exchangeRate?: number;
    isDefault?: boolean;
    active?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.currency.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.currency.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      symbol?: string;
      exchangeRate?: number;
      isDefault?: boolean;
      active?: boolean;
    },
  ) {
    if (data.isDefault) {
      await this.prisma.currency.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.currency.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) throw new NotFoundException('Currency not found');
    if (currency.isDefault) throw new Error('Cannot delete default currency');

    return this.prisma.currency.delete({
      where: { id },
    });
  }

  async setDefault(id: string) {
    return this.update(id, { isDefault: true });
  }

  async syncExchangeRates(rates: Record<string, number>) {
    // Expected format: { "EUR": 1.0, "USD": 1.05 }
    const currencies = await this.prisma.currency.findMany();

    for (const currency of currencies) {
      const newRate = rates[currency.code];
      if (newRate && newRate !== currency.exchangeRate.toNumber()) {
        await this.prisma.currency.update({
          where: { id: currency.id },
          data: { exchangeRate: newRate },
        });
      }
    }
  }
}
