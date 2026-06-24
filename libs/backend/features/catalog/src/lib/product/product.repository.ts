import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { Prisma } from '@dima-new/prisma-client';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(args: Prisma.ProductFindManyArgs) {
    return this.prisma.product.findMany(args);
  }

  async count(args: Prisma.ProductCountArgs) {
    return this.prisma.product.count(args);
  }

  async findUnique(args: Prisma.ProductFindUniqueArgs) {
    return this.prisma.product.findUnique(args);
  }

  async create(args: Prisma.ProductCreateArgs) {
    return this.prisma.product.create(args);
  }

  async update(args: Prisma.ProductUpdateArgs) {
    return this.prisma.product.update(args);
  }

  async delete(args: Prisma.ProductDeleteArgs) {
    return this.prisma.product.delete(args);
  }

  async createManyImages(args: Prisma.ProductImageCreateManyArgs) {
    return this.prisma.productImage.createMany(args);
  }

  async createManyFeatures(args: Prisma.ProductFeatureCreateManyArgs) {
    return this.prisma.productFeature.createMany(args);
  }

  async createStock(args: Prisma.StockCreateArgs) {
    return this.prisma.stock.create(args);
  }

  async createCombination(args: Prisma.ProductCombinationCreateArgs) {
    return this.prisma.productCombination.create(args);
  }

  async createManyCombinationAttributes(
    args: Prisma.ProductCombinationAttributeCreateManyArgs,
  ) {
    return this.prisma.productCombinationAttribute.createMany(args);
  }
}
