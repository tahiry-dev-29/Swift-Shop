import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@dima-new/prisma-client';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';

type ProductDuplicationSource = Prisma.ProductGetPayload<{
  include: {
    images: true;
    features: true;
    combinations: {
      include: {
        attributes: true;
        stock: true;
      };
    };
    stock: true;
  };
}>;

@Injectable()
export class ProductDuplicateService {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly productService: ProductService,
  ) {}

  async duplicate(id: string) {
    const source = (await this.productRepo.findUnique({
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
    })) as ProductDuplicationSource | null;

    if (!source) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    const newReference = `${source.reference}-DUP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newSlug = `${source.slug}-copy-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Create Product
    const duplicatedProduct = await this.productRepo.create({
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
      await this.productRepo.createManyImages({
        data: source.images.map(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ({ id, productId, dateAdd, ...img }) => ({
            ...img,
            productId: duplicatedProduct.id,
          }),
        ),
      });
    }

    // 3. Duplicate Features
    if (source.features.length > 0) {
      await this.productRepo.createManyFeatures({
        data: source.features.map(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ({ id, productId, ...feat }) => ({
            ...feat,
            productId: duplicatedProduct.id,
          }),
        ),
      });
    }

    // 4. Duplicate Stock (if simple product)
    if (source.stock) {
      await this.productRepo.createStock({
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
      const duplicatedCombo = await this.productRepo.createCombination({
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
        await this.productRepo.createManyCombinationAttributes({
          data: combo.attributes.map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ id, combinationId, ...attr }) => ({
              ...attr,
              combinationId: duplicatedCombo.id,
            }),
          ),
        });
      }

      // Duplicate Combination Stock
      if (combo.stock) {
        await this.productRepo.createStock({
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
