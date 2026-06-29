import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { Prisma } from '@dima-new/prisma-client';

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany<T extends Prisma.ProductFindManyArgs>(
    args: Prisma.SelectSubset<T, Prisma.ProductFindManyArgs>,
  ) {
    return this.prisma.product.findMany(args);
  }

  count<T extends Prisma.ProductCountArgs>(
    args: Prisma.SelectSubset<T, Prisma.ProductCountArgs>,
  ) {
    return this.prisma.product.count(args);
  }

  findUnique<T extends Prisma.ProductFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.ProductFindUniqueArgs>,
  ) {
    return this.prisma.product.findUnique(args);
  }

  create<T extends Prisma.ProductCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.ProductCreateArgs>,
  ) {
    return this.prisma.product.create(args);
  }

  update<T extends Prisma.ProductUpdateArgs>(
    args: Prisma.SelectSubset<T, Prisma.ProductUpdateArgs>,
  ) {
    return this.prisma.product.update(args);
  }

  delete<T extends Prisma.ProductDeleteArgs>(
    args: Prisma.SelectSubset<T, Prisma.ProductDeleteArgs>,
  ) {
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
