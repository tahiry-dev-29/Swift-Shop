import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { ProductService } from './product.service';

@Injectable()
export class ProductDuplicateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
  ) {}

  async duplicate(id: string) {
    const source = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        features: true,
        combinations: {
          include: {
            attributes: true,
            stock: true,
          },
        },
        stock: true,
      },
    });

    if (!source) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    const newReference = `${source.reference}-DUP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newSlug = `${source.slug}-copy-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Create Product
    const duplicatedProduct = await this.prisma.product.create({
      data: {
        name: `${source.name} (Copy)`,
        reference: newReference,
        slug: newSlug,
        description: source.description,
        descriptionShort: source.descriptionShort,
        price: source.price,
        wholesalePrice: source.wholesalePrice,
        weight: source.weight,
        active: false, // Copies are inactive by default
        availableForOrder: source.availableForOrder,
        metaTitle: source.metaTitle,
        metaDescription: source.metaDescription,
        categoryId: source.categoryId,
      },
    });

    // 2. Duplicate Images
    if (source.images.length > 0) {
      await this.prisma.productImage.createMany({
        data: source.images.map((imgItem) => {
          const img = { ...imgItem } as Record<string, unknown>;
          delete img['id'];
          delete img['productId'];
          delete img['dateAdd'];
          return {
            ...img,
            productId: duplicatedProduct.id,
          } as import('@prisma/client').Prisma.ProductImageCreateManyInput;
        }),
      });
    }

    // 3. Duplicate Features
    if (source.features.length > 0) {
      await this.prisma.productFeature.createMany({
        data: source.features.map((featItem) => {
          const feat = { ...featItem } as Record<string, unknown>;
          delete feat['id'];
          delete feat['productId'];
          return {
            ...feat,
            productId: duplicatedProduct.id,
          } as import('@prisma/client').Prisma.ProductFeatureCreateManyInput;
        }),
      });
    }

    // 4. Duplicate Stock (if simple product)
    if (source.stock) {
      await this.prisma.stock.create({
        data: {
          productId: duplicatedProduct.id,
          quantity: source.stock.quantity,
          minQuantity: source.stock.minQuantity,
          outOfStockBehavior: source.stock.outOfStockBehavior,
        },
      });
    }

    // 5. Duplicate Combinations
    for (const combo of source.combinations) {
      const duplicatedCombo = await this.prisma.productCombination.create({
        data: {
          productId: duplicatedProduct.id,
          reference: combo.reference ? `${combo.reference}-DUP` : null,
          priceImpact: combo.priceImpact,
          weightImpact: combo.weightImpact,
          active: combo.active,
          isDefault: combo.isDefault,
        },
      });

      // Duplicate Combination Attributes
      if (combo.attributes.length > 0) {
        await this.prisma.productCombinationAttribute.createMany({
          data: combo.attributes.map((attrItem) => {
            const attr = { ...attrItem } as Record<string, unknown>;
            delete attr['id'];
            delete attr['combinationId'];
            return {
              ...attr,
              combinationId: duplicatedCombo.id,
            } as import('@prisma/client').Prisma.ProductCombinationAttributeCreateManyInput;
          }),
        });
      }

      // Duplicate Combination Stock
      if (combo.stock) {
        await this.prisma.stock.create({
          data: {
            combinationId: duplicatedCombo.id,
            quantity: combo.stock.quantity,
            minQuantity: combo.stock.minQuantity,
            outOfStockBehavior: combo.stock.outOfStockBehavior,
          },
        });
      }
    }

    return this.productService.findById(duplicatedProduct.id);
  }
}
