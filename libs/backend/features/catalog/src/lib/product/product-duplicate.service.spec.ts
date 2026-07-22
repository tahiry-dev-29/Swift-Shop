import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ProductDuplicateService } from './product-duplicate.service';
import { ProductRepository } from './product.repository';
import { ProductService } from './product.service';
import { NotFoundException } from '@nestjs/common';

function makeRepo(): Mocked<ProductRepository> {
  return {
    findUnique: vi.fn(),
    create: vi.fn(),
    createManyImages: vi.fn(),
    createManyFeatures: vi.fn(),
    createStock: vi.fn(),
    createCombination: vi.fn(),
    createManyCombinationAttributes: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as Mocked<ProductRepository>;
}

function makeProductService(): Mocked<ProductService> {
  return {
    findById: vi.fn(),
  } as unknown as Mocked<ProductService>;
}

const SOURCE_PRODUCT = {
  id: 'p-src',
  name: 'Widget Pro',
  reference: 'WGT-001',
  slug: 'widget-pro',
  description: 'A widget',
  descriptionShort: 'Widget',
  price: 99,
  wholesalePrice: 50,
  weight: 500,
  active: true,
  availableForOrder: true,
  metaTitle: 'Widget',
  metaDescription: 'Widget description',
  categoryId: 'cat1',
  images: [
    {
      id: 'img1',
      productId: 'p-src',
      url: '/img.jpg',
      cover: true,
      position: 0,
      dateAdd: new Date(),
    },
  ],
  features: [
    { id: 'feat1', productId: 'p-src', featureId: 'f1', featureValueId: 'fv1' },
  ],
  stock: { quantity: 10, minQuantity: 1, outOfStockBehavior: 'deny' },
  combinations: [
    {
      id: 'combo1',
      reference: 'WGT-RED',
      priceImpact: 5,
      weightImpact: 0,
      active: true,
      isDefault: true,
      attributes: [
        { id: 'ca1', combinationId: 'combo1', attributeValueId: 'av1' },
      ],
      stock: { quantity: 5, minQuantity: 0, outOfStockBehavior: 'deny' },
    },
  ],
};

describe('ProductDuplicateService', () => {
  let service: ProductDuplicateService;
  let productRepo: Mocked<ProductRepository>;
  let productService: Mocked<ProductService>;

  beforeEach(() => {
    productRepo = makeRepo();
    productService = makeProductService();
    service = new ProductDuplicateService(productRepo, productService);
  });

  it('should throw NotFoundException when source product not found', async () => {
    productRepo.findUnique.mockResolvedValue(null);
    await expect(service.duplicate('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create a copy of the product with modified name, reference, slug', async () => {
    productRepo.findUnique.mockResolvedValue(SOURCE_PRODUCT as never);
    const duplicated = { id: 'p-dup' } as never;
    const finalProduct = { id: 'p-dup', name: 'Widget Pro (Copy)' } as never;

    productRepo.create.mockResolvedValue(duplicated);
    productRepo.createManyImages.mockResolvedValue(undefined);
    productRepo.createManyFeatures.mockResolvedValue(undefined);
    productRepo.createStock.mockResolvedValue(undefined);
    productRepo.createCombination.mockResolvedValue({
      id: 'combo-dup',
    } as never);
    productRepo.createManyCombinationAttributes.mockResolvedValue(undefined);
    productService.findById.mockResolvedValue(finalProduct);

    const result = await service.duplicate('p-src');

    // Created product should be inactive by default
    expect(productRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Widget Pro (Copy)',
          active: false,
          reference: expect.stringContaining('WGT-001-DUP-'),
          slug: expect.stringContaining('widget-pro-copy-'),
        }),
      }),
    );
    expect(result).toBe(finalProduct);
  });

  it('should duplicate images when source has images', async () => {
    productRepo.findUnique.mockResolvedValue(SOURCE_PRODUCT as never);
    const duplicated = { id: 'p-dup' } as never;
    productRepo.create.mockResolvedValue(duplicated);
    productRepo.createManyImages.mockResolvedValue(undefined);
    productRepo.createManyFeatures.mockResolvedValue(undefined);
    productRepo.createStock.mockResolvedValue(undefined);
    productRepo.createCombination.mockResolvedValue({
      id: 'combo-dup',
    } as never);
    productRepo.createManyCombinationAttributes.mockResolvedValue(undefined);
    productService.findById.mockResolvedValue({} as never);

    await service.duplicate('p-src');

    expect(productRepo.createManyImages).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ productId: 'p-dup', url: '/img.jpg' }),
        ]),
      }),
    );
  });

  it('should duplicate features when source has features', async () => {
    productRepo.findUnique.mockResolvedValue(SOURCE_PRODUCT as never);
    const duplicated = { id: 'p-dup' } as never;
    productRepo.create.mockResolvedValue(duplicated);
    productRepo.createManyImages.mockResolvedValue(undefined);
    productRepo.createManyFeatures.mockResolvedValue(undefined);
    productRepo.createStock.mockResolvedValue(undefined);
    productRepo.createCombination.mockResolvedValue({
      id: 'combo-dup',
    } as never);
    productRepo.createManyCombinationAttributes.mockResolvedValue(undefined);
    productService.findById.mockResolvedValue({} as never);

    await service.duplicate('p-src');

    expect(productRepo.createManyFeatures).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ productId: 'p-dup' }),
        ]),
      }),
    );
  });

  it('should duplicate product-level stock', async () => {
    productRepo.findUnique.mockResolvedValue(SOURCE_PRODUCT as never);
    const duplicated = { id: 'p-dup' } as never;
    productRepo.create.mockResolvedValue(duplicated);
    productRepo.createManyImages.mockResolvedValue(undefined);
    productRepo.createManyFeatures.mockResolvedValue(undefined);
    productRepo.createStock.mockResolvedValue(undefined);
    productRepo.createCombination.mockResolvedValue({
      id: 'combo-dup',
    } as never);
    productRepo.createManyCombinationAttributes.mockResolvedValue(undefined);
    productService.findById.mockResolvedValue({} as never);

    await service.duplicate('p-src');

    // First createStock call should be for product-level stock
    expect(productRepo.createStock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'p-dup',
          quantity: 10,
        }),
      }),
    );
  });

  it('should duplicate combinations with their attributes and stock', async () => {
    productRepo.findUnique.mockResolvedValue(SOURCE_PRODUCT as never);
    const duplicated = { id: 'p-dup' } as never;
    const comboDup = { id: 'combo-dup' } as never;
    productRepo.create.mockResolvedValue(duplicated);
    productRepo.createManyImages.mockResolvedValue(undefined);
    productRepo.createManyFeatures.mockResolvedValue(undefined);
    productRepo.createStock.mockResolvedValue(undefined);
    productRepo.createCombination.mockResolvedValue(comboDup);
    productRepo.createManyCombinationAttributes.mockResolvedValue(undefined);
    productService.findById.mockResolvedValue({} as never);

    await service.duplicate('p-src');

    expect(productRepo.createCombination).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'p-dup',
          reference: 'WGT-RED-DUP',
        }),
      }),
    );
    expect(productRepo.createManyCombinationAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            combinationId: 'combo-dup',
            attributeValueId: 'av1',
          }),
        ]),
      }),
    );
    // Combination-level stock
    expect(productRepo.createStock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          combinationId: 'combo-dup',
          quantity: 5,
        }),
      }),
    );
  });

  it('should skip images when source has none', async () => {
    const noImages = {
      ...SOURCE_PRODUCT,
      images: [],
      features: [],
      stock: null,
      combinations: [],
    };
    productRepo.findUnique.mockResolvedValue(noImages as never);
    productRepo.create.mockResolvedValue({ id: 'p-dup' } as never);
    productService.findById.mockResolvedValue({} as never);

    await service.duplicate('p-src');

    expect(productRepo.createManyImages).not.toHaveBeenCalled();
    expect(productRepo.createManyFeatures).not.toHaveBeenCalled();
    expect(productRepo.createStock).not.toHaveBeenCalled();
    expect(productRepo.createCombination).not.toHaveBeenCalled();
  });
});
