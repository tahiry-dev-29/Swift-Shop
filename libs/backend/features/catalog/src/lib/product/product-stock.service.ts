import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { UpdateStockInput } from './dto';

@Injectable()
export class ProductStockService {
  constructor(private readonly prisma: PrismaService) {}

  async updateStock(input: UpdateStockInput) {
    const { productId, combinationId, ...stockData } = input;

    if (!productId && !combinationId) {
      throw new BadRequestException(
        'Either productId or combinationId must be provided',
      );
    }

    const where = productId ? { productId } : { combinationId };

    return this.prisma.stock.upsert({
      where,
      update: stockData,
      create: {
        productId,
        combinationId,
        ...stockData,
      },
    });
  }

  async incrementStock(stockId: string, quantity: number) {
    return this.prisma.stock.update({
      where: { id: stockId },
      data: { quantity: { increment: quantity } },
    });
  }

  async decrementStock(stockId: string, quantity: number) {
    const stock = await this.prisma.stock.findUnique({
      where: { id: stockId },
    });
    if (!stock) {
      throw new NotFoundException(`Stock #${stockId} not found`);
    }

    const result = await this.prisma.stock.updateMany({
      where: { id: stockId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });

    if (result.count === 0) {
      throw new BadRequestException('Insufficient stock quantity');
    }

    return this.prisma.stock.findUnique({ where: { id: stockId } });
  }

  async checkAvailability(
    productId?: string,
    combinationId?: string,
    quantity = 1,
  ) {
    const stock = await this.prisma.stock.findFirst({
      where: {
        OR: [
          { productId: productId ?? undefined },
          { combinationId: combinationId ?? undefined },
        ],
      },
    });

    if (!stock) return false;
    if (stock.outOfStockBehavior === 'allow') return true;
    return stock.quantity >= quantity;
  }
}
