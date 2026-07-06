import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';

@Injectable()
export class PriceQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findBestSpecificPrice(params: {
    productId: string;
    combinationId?: string;
    customerId?: string;
    countryId: string;
    quantity: number;
  }): Promise<Record<string, unknown> | null> {
    const { productId, combinationId, customerId, countryId, quantity } =
      params;
    const now = new Date();

    let customerGroupId: string | undefined;
    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        select: { groupId: true },
      });
      customerGroupId = customer?.groupId;
    }

    const conditions: Record<string, unknown>[] = [
      { active: true },
      { fromQuantity: { lte: quantity } },
      { OR: [{ dateFrom: null }, { dateFrom: { lte: now } }] },
      { OR: [{ dateTo: null }, { dateTo: { gte: now } }] },
    ];

    const targetConditions: Record<string, unknown>[] = [];

    if (combinationId) {
      targetConditions.push({ combinationId });
    }
    targetConditions.push({ productId, combinationId: null });
    if (customerId) {
      targetConditions.push({ customerId });
    }
    if (customerGroupId) {
      targetConditions.push({ customerGroupId });
    }
    targetConditions.push({ countryId });
    targetConditions.push({
      productId: null,
      combinationId: null,
      customerId: null,
      customerGroupId: null,
      countryId: null,
    });

    conditions.push({ OR: targetConditions });

    const specificPrices = await this.prisma.specificPrice.findMany({
      where: { AND: conditions },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    });

    return specificPrices[0] || null;
  }

  async getTaxRate(countryId: string): Promise<number> {
    const taxRule = await this.prisma.taxRule.findFirst({
      where: { countryId, active: true },
      orderBy: { id: 'desc' },
    });

    if (taxRule) {
      return Number(taxRule.rate);
    }

    const country = await this.prisma.country.findUnique({
      where: { id: countryId },
    });

    if (!country) {
      throw new Error(`Country #${countryId} not found`);
    }

    return Number(country.taxRate);
  }
}
