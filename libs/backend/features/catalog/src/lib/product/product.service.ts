import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  

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
        include: {
          images: { orderBy: { position: 'asc' } },
          combinations: {
            include: {
              attributes: { include: { attributeValue: true } },
              stock: true,
            },
          },
          stock: true,
          category: true,
        },
        orderBy: { dateAdd: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { position: 'asc' } },
        combinations: {
          include: {
            attributes: { include: { attributeValue: true } },
            stock: true,
          },
        },
        stock: true,
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    return product;
  }

  async create(input: CreateProductInput) {
    return this.prisma.product.create({
      data: input,
      include: { category: true },
    });
  }

  async update(id: string, input: UpdateProductInput) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: input,
      include: {
        images: true,
        combinations: true,
        stock: true,
        category: true,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }

  

  async addImage(productId: string, input: CreateProductImageInput) {
    await this.findById(productId);

    
    if (input.cover) {
      await this.prisma.productImage.updateMany({
        where: { productId },
        data: { cover: false },
      });
    }

    return this.prisma.productImage.create({
      data: {
        ...input,
        productId,
      },
    });
  }

  async removeImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException(`ProductImage #${imageId} not found`);
    }

    return this.prisma.productImage.delete({
      where: { id: imageId },
    });
  }

  async setCoverImage(imageId: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException(`ProductImage #${imageId} not found`);
    }

    
    await this.prisma.productImage.updateMany({
      where: { productId: image.productId },
      data: { cover: false },
    });

    
    return this.prisma.productImage.update({
      where: { id: imageId },
      data: { cover: true },
    });
  }

  

  async addCombination(productId: string, input: CreateProductCombinationInput) {
    await this.findById(productId);

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
    const combination = await this.prisma.productCombination.findUnique({
      where: { id },
    });

    if (!combination) {
      throw new NotFoundException(`ProductCombination #${id} not found`);
    }

    
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
    const combination = await this.prisma.productCombination.findUnique({
      where: { id },
    });

    if (!combination) {
      throw new NotFoundException(`ProductCombination #${id} not found`);
    }

    return this.prisma.productCombination.delete({
      where: { id },
    });
  }

  

  async updateStock(input: UpdateStockInput) {
    const { productId, combinationId, ...stockData } = input;

    
    const existingStock = await this.prisma.stock.findFirst({
      where: {
        OR: [
          { productId: productId ?? undefined },
          { combinationId: combinationId ?? undefined },
        ],
      },
    });

    if (existingStock) {
      return this.prisma.stock.update({
        where: { id: existingStock.id },
        data: stockData,
      });
    }

    return this.prisma.stock.create({
      data: {
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

    const newQuantity = Math.max(0, stock.quantity - quantity);
    return this.prisma.stock.update({
      where: { id: stockId },
      data: { quantity: newQuantity },
    });
  }

  async checkAvailability(productId?: string, combinationId?: string, quantity: number = 1) {
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

