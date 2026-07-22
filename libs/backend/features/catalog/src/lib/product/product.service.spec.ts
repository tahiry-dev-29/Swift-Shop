import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ProductService } from './product.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { ProductSearchService } from './product-search.service';
import { ProductRepository } from './product.repository';
import { NotFoundException } from '@nestjs/common';

function makePrisma(): Mocked<PrismaService> {
  return {
    auditLog: { create: vi.fn() },
  } as unknown as Mocked<PrismaService>;
}

function makeSearchService(): Mocked<ProductSearchService> {
  return {
    syncProduct: vi.fn().mockResolvedValue(undefined),
    deleteProduct: vi.fn().mockResolvedValue(undefined),
    search: vi.fn(),
  } as unknown as Mocked<ProductSearchService>;
}

function makeRepo(): Mocked<ProductRepository> {
  return {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createManyImages: vi.fn(),
    createManyFeatures: vi.fn(),
    createStock: vi.fn(),
    createCombination: vi.fn(),
    createManyCombinationAttributes: vi.fn(),
  } as unknown as Mocked<ProductRepository>;
}

describe('ProductService', () => {
  let service: ProductService;
  let prisma: Mocked<PrismaService>;
  let searchService: Mocked<ProductSearchService>;
  let productRepo: Mocked<ProductRepository>;

  beforeEach(() => {
    prisma = makePrisma();
    searchService = makeSearchService();
    productRepo = makeRepo();
    service = new ProductService(prisma, searchService, productRepo);
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return items and total with no filter', async () => {
      const items = [{ id: 'p1' }] as never;
      productRepo.findMany.mockResolvedValue(items);
      productRepo.count.mockResolvedValue(1);

      const result = await service.findAll();
      expect(result).toEqual({ items, total: 1 });
    });

    it('should filter by categoryId when provided', async () => {
      productRepo.findMany.mockResolvedValue([]);
      productRepo.count.mockResolvedValue(0);

      await service.findAll({ categoryId: 'cat1' });
      expect(productRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat1' }),
        }),
      );
    });

    it('should apply search filter on name and reference', async () => {
      productRepo.findMany.mockResolvedValue([]);
      productRepo.count.mockResolvedValue(0);

      await service.findAll({ search: 'widget' });
      expect(productRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });

    it('should apply skip/take pagination', async () => {
      productRepo.findMany.mockResolvedValue([]);
      productRepo.count.mockResolvedValue(0);

      await service.findAll({ skip: 10, take: 5 });
      expect(productRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should throw NotFoundException when product not found', async () => {
      productRepo.findUnique.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return product when found', async () => {
      const product = { id: 'p1', name: 'Widget' } as never;
      productRepo.findUnique.mockResolvedValue(product);

      const result = await service.findById('p1');
      expect(result).toBe(product);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should auto-generate slug when linkRewrite is not provided', async () => {
      const created = {
        id: 'p1',
        name: 'Widget',
        slug: 'widget-abc1',
      } as never;
      productRepo.create.mockResolvedValue(created);

      await service.create({ name: 'Widget', price: 10, reference: 'REF1' });
      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.stringMatching(/^widget-/),
          }),
        }),
      );
    });

    it('should use provided linkRewrite as slug', async () => {
      const created = { id: 'p1', slug: 'my-custom-slug' } as never;
      productRepo.create.mockResolvedValue(created);

      await service.create({
        name: 'Widget',
        price: 10,
        reference: 'REF1',
        linkRewrite: 'my-custom-slug',
      });
      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'my-custom-slug' }),
        }),
      );
    });

    it('should sync product to MeiliSearch after creation', async () => {
      const created = { id: 'p1', name: 'Widget' } as never;
      productRepo.create.mockResolvedValue(created);

      await service.create({ name: 'Widget', price: 10, reference: 'REF1' });
      expect(searchService.syncProduct).toHaveBeenCalledWith(created);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException when product not found', async () => {
      productRepo.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create price audit log when price changes', async () => {
      const current = { id: 'p1', price: '100' } as never;
      const updated = { id: 'p1', price: '120' } as never;
      productRepo.findUnique.mockResolvedValue(current);
      productRepo.update.mockResolvedValue(updated);
      prisma.auditLog.create.mockResolvedValue({} as never);

      await service.update('p1', { price: 120 });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'product.price_updated' }),
        }),
      );
    });

    it('should NOT create audit log when price is unchanged', async () => {
      const current = { id: 'p1', price: '100' } as never;
      productRepo.findUnique.mockResolvedValue(current);
      productRepo.update.mockResolvedValue(current);

      await service.update('p1', { price: 100 }); // same price
      expect(prisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should sync product to MeiliSearch after update', async () => {
      const current = { id: 'p1', price: '100' } as never;
      const updated = { id: 'p1', name: 'New' } as never;
      productRepo.findUnique.mockResolvedValue(current);
      productRepo.update.mockResolvedValue(updated);

      await service.update('p1', { name: 'New' });
      expect(searchService.syncProduct).toHaveBeenCalledWith(updated);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw NotFoundException when product does not exist', async () => {
      productRepo.findUnique.mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete and remove from MeiliSearch', async () => {
      const product = { id: 'p1' } as never;
      const deleted = { id: 'p1' } as never;
      productRepo.findUnique.mockResolvedValue(product);
      productRepo.delete.mockResolvedValue(deleted);

      const result = await service.delete('p1');
      expect(searchService.deleteProduct).toHaveBeenCalledWith('p1');
      expect(result).toBe(deleted);
    });
  });
});

// ─── ProductStockService ──────────────────────────────────────────────────

import { ProductStockService } from './product-stock.service';
import { BadRequestException } from '@nestjs/common';

function makeStockPrisma(): Mocked<PrismaService> {
  return {
    stock: {
      upsert: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  } as unknown as Mocked<PrismaService>;
}

describe('ProductStockService', () => {
  let service: ProductStockService;
  let prisma: Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makeStockPrisma();
    service = new ProductStockService(prisma);
  });

  describe('updateStock', () => {
    it('should throw BadRequestException when neither productId nor combinationId given', async () => {
      await expect(service.updateStock({ quantity: 5 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upsert stock by productId', async () => {
      const stock = { id: 's1', quantity: 10 } as never;
      prisma.stock.upsert.mockResolvedValue(stock);

      const result = await service.updateStock({
        productId: 'p1',
        quantity: 10,
      });
      expect(result).toBe(stock);
    });
  });

  describe('incrementStock', () => {
    it('should increment stock quantity', async () => {
      const updated = { id: 's1', quantity: 15 } as never;
      prisma.stock.update.mockResolvedValue(updated);

      const result = await service.incrementStock('s1', 5);
      expect(prisma.stock.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { quantity: { increment: 5 } } }),
      );
      expect(result).toBe(updated);
    });
  });

  describe('decrementStock', () => {
    it('should throw NotFoundException when stock not found', async () => {
      prisma.stock.findUnique.mockResolvedValue(null);
      await expect(service.decrementStock('missing', 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when quantity is insufficient', async () => {
      prisma.stock.findUnique.mockResolvedValue({
        id: 's1',
        quantity: 3,
      } as never);
      prisma.stock.updateMany.mockResolvedValue({ count: 0 } as never); // insufficient

      await expect(service.decrementStock('s1', 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should decrement and return updated stock', async () => {
      const updated = { id: 's1', quantity: 5 } as never;
      prisma.stock.findUnique
        .mockResolvedValueOnce({ id: 's1', quantity: 10 } as never) // initial check
        .mockResolvedValueOnce(updated); // after update
      prisma.stock.updateMany.mockResolvedValue({ count: 1 } as never);

      const result = await service.decrementStock('s1', 5);
      expect(result).toBe(updated);
    });
  });

  describe('checkAvailability', () => {
    it('should return false when neither productId nor combinationId provided', async () => {
      const result = await service.checkAvailability();
      expect(result).toBe(false);
    });

    it('should return false when no stock record found', async () => {
      prisma.stock.findFirst.mockResolvedValue(null);
      const result = await service.checkAvailability('p1');
      expect(result).toBe(false);
    });

    it('should return true when outOfStockBehavior is allow regardless of quantity', async () => {
      prisma.stock.findFirst.mockResolvedValue({
        outOfStockBehavior: 'allow',
        quantity: 0,
      } as never);
      const result = await service.checkAvailability('p1', undefined, 5);
      expect(result).toBe(true);
    });

    it('should return true when quantity is sufficient', async () => {
      prisma.stock.findFirst.mockResolvedValue({
        outOfStockBehavior: 'deny',
        quantity: 10,
      } as never);
      const result = await service.checkAvailability('p1', undefined, 5);
      expect(result).toBe(true);
    });

    it('should return false when quantity is insufficient', async () => {
      prisma.stock.findFirst.mockResolvedValue({
        outOfStockBehavior: 'deny',
        quantity: 2,
      } as never);
      const result = await service.checkAvailability('p1', undefined, 5);
      expect(result).toBe(false);
    });
  });
});

// ─── ProductCombinationService ─────────────────────────────────────────────

import { ProductCombinationService } from './product-combination.service';

function makeComboPrisma(): Mocked<PrismaService> {
  return {
    product: { findUnique: vi.fn() },
    productCombination: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as Mocked<PrismaService>;
}

describe('ProductCombinationService', () => {
  let service: ProductCombinationService;
  let prisma: Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makeComboPrisma();
    service = new ProductCombinationService(prisma);
  });

  describe('addCombination', () => {
    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.addCombination('missing', {
          attributeValueIds: [],
          priceImpact: 0,
          isDefault: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should unset other defaults when isDefault is true', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' } as never);
      prisma.productCombination.updateMany.mockResolvedValue({
        count: 2,
      } as never);
      prisma.productCombination.create.mockResolvedValue({ id: 'c1' } as never);

      await service.addCombination('p1', {
        attributeValueIds: ['av1'],
        priceImpact: 0,
        isDefault: true,
      });
      expect(prisma.productCombination.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isDefault: false } }),
      );
    });

    it('should create combination with linked attribute values', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' } as never);
      const combo = { id: 'c1' } as never;
      prisma.productCombination.create.mockResolvedValue(combo);

      const result = await service.addCombination('p1', {
        attributeValueIds: ['av1', 'av2'],
        priceImpact: 5,
        isDefault: false,
      });
      expect(prisma.productCombination.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'p1',
            attributes: {
              create: [
                { attributeValueId: 'av1' },
                { attributeValueId: 'av2' },
              ],
            },
          }),
        }),
      );
      expect(result).toBe(combo);
    });
  });

  describe('updateCombination', () => {
    it('should throw NotFoundException when combination not found', async () => {
      prisma.productCombination.findUnique.mockResolvedValue(null);
      await expect(service.updateCombination('missing', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should unset other defaults when updating to isDefault=true', async () => {
      prisma.productCombination.findUnique.mockResolvedValue({
        id: 'c1',
        productId: 'p1',
      } as never);
      prisma.productCombination.updateMany.mockResolvedValue({
        count: 1,
      } as never);
      prisma.productCombination.update.mockResolvedValue({ id: 'c1' } as never);

      await service.updateCombination('c1', { isDefault: true });
      expect(prisma.productCombination.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productId: 'p1',
            NOT: { id: 'c1' },
          }),
          data: { isDefault: false },
        }),
      );
    });
  });

  describe('deleteCombination', () => {
    it('should throw NotFoundException when combination not found', async () => {
      prisma.productCombination.findUnique.mockResolvedValue(null);
      await expect(service.deleteCombination('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete and return the combination', async () => {
      prisma.productCombination.findUnique.mockResolvedValue({
        id: 'c1',
      } as never);
      const deleted = { id: 'c1' } as never;
      prisma.productCombination.delete.mockResolvedValue(deleted);

      const result = await service.deleteCombination('c1');
      expect(result).toBe(deleted);
    });
  });
});

// ─── ProductImageService ───────────────────────────────────────────────────

import { ProductImageService } from './product-image.service';

function makeImagePrisma(): Mocked<PrismaService> {
  return {
    product: { findUnique: vi.fn() },
    productImage: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  } as unknown as Mocked<PrismaService>;
}

describe('ProductImageService', () => {
  let service: ProductImageService;
  let prisma: Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makeImagePrisma();
    service = new ProductImageService(prisma);
  });

  describe('addImage', () => {
    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(
        service.addImage('missing', { url: '/img.jpg', cover: false }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should unset existing cover images when cover=true', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' } as never);
      prisma.productImage.updateMany.mockResolvedValue({ count: 2 } as never);
      prisma.productImage.create.mockResolvedValue({
        id: 'img1',
        cover: true,
      } as never);

      await service.addImage('p1', { url: '/new.jpg', cover: true });
      expect(prisma.productImage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { cover: false } }),
      );
    });

    it('should NOT unset covers when cover=false', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' } as never);
      prisma.productImage.create.mockResolvedValue({
        id: 'img1',
        cover: false,
      } as never);

      await service.addImage('p1', { url: '/img.jpg', cover: false });
      expect(prisma.productImage.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('removeImage', () => {
    it('should throw NotFoundException when image not found', async () => {
      prisma.productImage.findUnique.mockResolvedValue(null);
      await expect(service.removeImage('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete and return the image', async () => {
      const img = { id: 'img1' } as never;
      prisma.productImage.findUnique.mockResolvedValue(img);
      prisma.productImage.delete.mockResolvedValue(img);

      const result = await service.removeImage('img1');
      expect(result).toBe(img);
    });
  });

  describe('setCoverImage', () => {
    it('should throw NotFoundException when image not found', async () => {
      prisma.productImage.findUnique.mockResolvedValue(null);
      await expect(service.setCoverImage('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should unset all covers then set the target image as cover', async () => {
      const img = { id: 'img1', productId: 'p1' } as never;
      const updated = { id: 'img1', cover: true } as never;
      prisma.productImage.findUnique.mockResolvedValue(img);
      prisma.productImage.updateMany.mockResolvedValue({ count: 3 } as never);
      prisma.productImage.update.mockResolvedValue(updated);

      const result = await service.setCoverImage('img1');
      expect(prisma.productImage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { productId: 'p1' },
          data: { cover: false },
        }),
      );
      expect(prisma.productImage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'img1' },
          data: { cover: true },
        }),
      );
      expect(result).toBe(updated);
    });
  });
});
