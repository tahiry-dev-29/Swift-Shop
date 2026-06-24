import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { PriceResult, CalculatePriceParams } from '@dima-new/models';

@Injectable()
export class PriceCalculationService {
  constructor(private prisma: PrismaService) {}

  async calculatePrice(params: CalculatePriceParams): Promise<PriceResult> {
    const {
      productId,
      combinationId,
      customerId,
      countryId,
      currencyId,
      quantity = 1,
    } = params;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product #${productId} not found`);
    }

    let price = Number(product.price);
    const basePrice = price;

    let combinationImpact = 0;
    if (combinationId) {
      const combination = await this.prisma.productCombination.findUnique({
        where: { id: combinationId },
      });

      if (combination) {
        combinationImpact = Number(combination.priceImpact);
        price += combinationImpact;
      }
    }

    let customerGroupReduction = 0;
    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
        include: { group: true },
      });

      if (customer && customer.group) {
        const groupReductionPercent = Number(customer.group.reduction);
        customerGroupReduction = (price * groupReductionPercent) / 100;
        price -= customerGroupReduction;
      }
    }

    const specificPrice = await this.findBestSpecificPrice({
      productId,
      combinationId,
      customerId,
      countryId,
      quantity,
    });

    let specificPriceReduction = 0;
    if (specificPrice) {
      if (specificPrice.reductionType === 'percentage') {
        specificPriceReduction =
          (price * Number(specificPrice.reduction)) / 100;
      } else {
        specificPriceReduction = Number(specificPrice.reduction);
      }
      price -= specificPriceReduction;
    }

    let priceHT = Math.max(0, price);

    const taxRate = await this.getTaxRate(countryId);
    let taxAmount = (priceHT * taxRate) / 100;
    let priceTTC = priceHT + taxAmount;

    // Currency Support and Rounding Rules
    let exchangeRate = 1;
    let roundingDecimals = 2;

    if (currencyId) {
      const currency = await this.prisma.currency.findUnique({
        where: { id: currencyId },
      });
      if (currency) {
        exchangeRate = Number(currency.exchangeRate);
        roundingDecimals = currency.roundingDecimals;
      }
    }

    if (exchangeRate !== 1) {
      priceHT *= exchangeRate;
      taxAmount *= exchangeRate;
      priceTTC *= exchangeRate;
    }

    const factor = Math.pow(10, roundingDecimals);
    priceHT = Math.round(priceHT * factor) / factor;
    taxAmount = Math.round(taxAmount * factor) / factor;
    priceTTC = Math.round((priceHT + taxAmount) * factor) / factor;

    return {
      basePrice,
      combinationImpact,
      customerGroupReduction,
      specificPriceReduction,
      priceHT,
      taxRate,
      taxAmount,
      priceTTC,
      currencyId,
      exchangeRate,
    };
  }

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
    ];

    conditions.push({
      OR: [{ dateFrom: null }, { dateFrom: { lte: now } }],
    });

    conditions.push({
      OR: [{ dateTo: null }, { dateTo: { gte: now } }],
    });

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

    conditions.push({
      OR: targetConditions,
    });

    const specificPrices = await this.prisma.specificPrice.findMany({
      where: {
        AND: conditions,
      },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    });

    return specificPrices[0] || null;
  }

  async getTaxRate(countryId: string): Promise<number> {
    const taxRule = await this.prisma.taxRule.findFirst({
      where: {
        countryId,
        active: true,
      },
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
