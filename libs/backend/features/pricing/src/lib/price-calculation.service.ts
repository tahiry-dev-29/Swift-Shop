import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { PriceResult, CalculatePriceParams } from '@dima-new/models';
import { PriceQueryService } from './price-query.service';

@Injectable()
export class PriceCalculationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceQuery: PriceQueryService,
  ) {}

  async calculatePrice(params: CalculatePriceParams): Promise<PriceResult> {
    const {
      productId,
      combinationId,
      customerId,
      countryId,
      quantity = 1,
      currencyCode,
      cartRuleCodes,
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
        if (!customer.group.showPrices) {
          throw new Error('Prices are hidden for this customer group');
        }
        const groupReductionPercent = Number(customer.group.reduction);
        customerGroupReduction = (price * groupReductionPercent) / 100;
        price -= customerGroupReduction;
      }
    }

    const specificPrice = await this.priceQuery.findBestSpecificPrice({
      productId,
      combinationId,
      customerId,
      countryId,
      quantity,
    });

    let specificPriceReduction = 0;
    if (specificPrice) {
      if (specificPrice['reductionType'] === 'percentage') {
        specificPriceReduction =
          (price * Number(specificPrice['reduction'])) / 100;
      } else {
        specificPriceReduction = Number(specificPrice['reduction']);
      }
      price -= specificPriceReduction;
    }

    let cartRuleReduction = 0;
    if (cartRuleCodes && cartRuleCodes.length > 0) {
      cartRuleReduction = await this.applyCartRules(cartRuleCodes, price);
      price -= cartRuleReduction;
    }

    let exchangeRate = 1;
    if (currencyCode) {
      const currency = await this.prisma.currency.findUnique({
        where: { code: currencyCode },
      });
      if (!currency) {
        throw new Error('Currency ' + currencyCode + ' not found');
      }
      exchangeRate = Number(currency.exchangeRate);
    }

    const priceHT = this.roundPrice(Math.max(0, price) * exchangeRate);
    const taxRate = await this.priceQuery.getTaxRate(countryId);
    const taxAmount = this.roundPrice((priceHT * taxRate) / 100);
    const priceTTC = this.roundPrice(priceHT + taxAmount);
    const loyaltyPointsEarned = Math.floor(priceTTC / 10);

    return {
      basePrice: this.roundPrice(basePrice * exchangeRate),
      combinationImpact: this.roundPrice(combinationImpact * exchangeRate),
      customerGroupReduction: this.roundPrice(
        customerGroupReduction * exchangeRate,
      ),
      specificPriceReduction: this.roundPrice(
        specificPriceReduction * exchangeRate,
      ),
      cartRuleReduction: this.roundPrice(cartRuleReduction * exchangeRate),
      priceHT,
      taxRate,
      taxAmount,
      priceTTC,
      currencyCode,
      loyaltyPointsEarned,
    };
  }

  private async applyCartRules(
    codes: string[],
    price: number,
  ): Promise<number> {
    const now = new Date();
    const cartRules = await this.prisma.cartRule.findMany({
      where: {
        code: { in: codes },
        active: true,
        OR: [{ dateFrom: null }, { dateFrom: { lte: now } }],
        AND: [
          { OR: [{ dateTo: null }, { dateTo: { gte: now } }] },
          { minimumAmount: { lte: price } },
          { quantity: { gt: 0 } },
        ],
      },
    });

    let total = 0;
    for (const rule of cartRules) {
      if (rule.reductionType === 'percentage') {
        total += (price * Number(rule.reduction)) / 100;
      } else {
        total += Number(rule.reduction);
      }
    }
    return total;
  }

  private roundPrice(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
