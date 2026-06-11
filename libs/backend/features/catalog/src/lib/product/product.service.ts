import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  CreateProductInput,
  UpdateProductInput,
  CreateProductImageInput,
  CreateProductCombinationInput,
  UpdateProductCombinationInput,
  UpdateStockInput,
  ProductFilterInput,
} from './dto';
import { ProductCombinationService } from './product-combination.service';
import { ProductImageService } from './product-image.service';
import { ProductStockService } from './product-stock.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageService: ProductImageService,
    private readonly combinationService: ProductCombinationService,
    private readonly stockService: ProductStockService,
  ) {}

  async findAll(filter?: ProductFilterInput) {
    const where: Record<string, unknown> = {};

    if (filter?.categoryId) where['categoryId'] = filter.categoryId;
    if (filter?.active !== undefined) where['active'] = filter.active;
    if (filter?.search) {
      where['OR'] = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { reference: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: filter?.skip ?? 0,
        take: filter?.take ?? 20,
        include: this.productInclude(),
        orderBy: { dateAdd: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.productInclude(),
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 6)
    );
  }

  async create({ categoryId, linkRewrite, ...input }: CreateProductInput) {
    const slug = linkRewrite || this.generateSlug(input.name);
    const data: Prisma.ProductUncheckedCreateInput = {
      ...input,
      slug,
      categoryId: categoryId ?? null,
    };
    return this.prisma.product.create({
      data,
      include: { category: true },
    });
  }

  async update(
    id: string,
    { categoryId, linkRewrite, ...input }: UpdateProductInput,
  ) {
    await this.findById(id);
    const data: Prisma.ProductUpdateInput = {
      ...input,
      ...(linkRewrite ? { slug: linkRewrite } : {}),
      ...(categoryId !== undefined ? { categoryId: categoryId ?? null } : {}),
    };
    return this.prisma.product.update({
      where: { id },
      data,
      include: this.productInclude(),
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({ where: { id } });
  }

  addImage(productId: string, input: CreateProductImageInput) {
    return this.imageService.addImage(productId, input);
  }

  removeImage(imageId: string) {
    return this.imageService.removeImage(imageId);
  }

  setCoverImage(imageId: string) {
    return this.imageService.setCoverImage(imageId);
  }

  addCombination(productId: string, input: CreateProductCombinationInput) {
    return this.combinationService.addCombination(productId, input);
  }

  updateCombination(id: string, input: UpdateProductCombinationInput) {
    return this.combinationService.updateCombination(id, input);
  }

  deleteCombination(id: string) {
    return this.combinationService.deleteCombination(id);
  }

  updateStock(input: UpdateStockInput) {
    return this.stockService.updateStock(input);
  }

  incrementStock(stockId: string, quantity: number) {
    return this.stockService.incrementStock(stockId, quantity);
  }

  decrementStock(stockId: string, quantity: number) {
    return this.stockService.decrementStock(stockId, quantity);
  }

  checkAvailability(
    productId?: string,
    combinationId?: string,
    quantity?: number,
  ) {
    return this.stockService.checkAvailability(
      productId,
      combinationId,
      quantity,
    );
  }

  private productInclude(): Prisma.ProductInclude {
    return {
      images: { orderBy: { position: 'asc' } },
      combinations: {
        include: {
          attributes: { include: { attributeValue: true } },
          stock: true,
        },
      },
      stock: true,
      category: true,
    };
  }
}
