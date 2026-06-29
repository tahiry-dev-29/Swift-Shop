import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';

@Injectable()
export class ShippingCalculationService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableCarriers(countryIsoCode: string, weightGrams: number) {
    if (weightGrams < 0) {
      throw new BadRequestException('Weight must be positive');
    }

    const zone = await this.prisma.shippingZone.findFirst({
      where: {
        active: true,
        countries: { has: countryIsoCode.toUpperCase() },
      },
    });

    if (!zone) {
      return [];
    }

    const rates = await this.prisma.shippingRate.findMany({
      where: {
        zoneId: zone.id,
        active: true,
        carrier: { active: true },
        minWeightGrams: { lte: weightGrams },
        OR: [
          { maxWeightGrams: null },
          { maxWeightGrams: { gte: weightGrams } },
        ],
      },
      include: { carrier: true },
      orderBy: { price: 'asc' },
    });

    return rates.map((rate) => ({
      carrierId: rate.carrierId,
      carrierCode: rate.carrier.code,
      carrierName: rate.carrier.name,
      price: Number(rate.price),
      currency: rate.currency,
    }));
  }

  async calculateShippingCost(
    carrierId: string,
    countryIsoCode: string,
    weightGrams: number,
  ) {
    const quotes = await this.getAvailableCarriers(countryIsoCode, weightGrams);
    const quote = quotes.find((item) => item.carrierId === carrierId);

    if (!quote) {
      throw new BadRequestException(
        'Carrier is not available for this shipment',
      );
    }

    return quote;
  }
}
