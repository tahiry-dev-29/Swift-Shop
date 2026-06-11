import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  CreateProductCombinationInput,
  UpdateProductCombinationInput,
} from './dto';

@Injectable()
export class ProductCombinationService {
  constructor(private readonly prisma: PrismaService) {}

  async addCombination(
    productId: string,
    input: CreateProductCombinationInput,
  ) {
    await this.assertProductExists(productId);
    const { attributeValueIds, ...combinationData } = input;

    if (input.isDefault) {
      await this.prisma.productCombination.updateMany({
        where: { productId },
        data: { isDefault: false },
      });
    }

    return this.prisma.productCombination.create({
      data: {
        ...combinationData,
        productId,
        attributes: {
          create: attributeValueIds.map((attrId) => ({
            attributeValueId: attrId,
          })),
        },
      },
      include: {
        attributes: { include: { attributeValue: true } },
        stock: true,
      },
    });
  }

  async updateCombination(id: string, input: UpdateProductCombinationInput) {
    const combination = await this.findCombination(id);

    if (input.isDefault) {
      await this.prisma.productCombination.updateMany({
        where: { productId: combination.productId, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.productCombination.update({
      where: { id },
      data: input,
      include: {
        attributes: { include: { attributeValue: true } },
        stock: true,
      },
    });
  }

  async deleteCombination(id: string) {
    await this.findCombination(id);
    return this.prisma.productCombination.delete({
      where: { id },
    });
  }

  private async findCombination(id: string) {
    const combination = await this.prisma.productCombination.findUnique({
      where: { id },
    });
    if (!combination) {
      throw new NotFoundException(`ProductCombination #${id} not found`);
    }
    return combination;
  }

  private async assertProductExists(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }
  }
}
