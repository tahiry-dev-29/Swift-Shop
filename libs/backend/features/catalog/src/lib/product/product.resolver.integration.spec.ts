import { Test, TestingModule } from '@nestjs/testing';
import { ProductResolver } from './product.resolver';
import { ProductService } from './product.service';
import { ProductImageService } from './product-image.service';
import { ProductCombinationService } from './product-combination.service';
import { ProductStockService } from './product-stock.service';
import { ProductDuplicateService } from './product-duplicate.service';
import { SuperAdminGuard } from '@swift-shop/backend/auth';

describe('ProductResolver (Integration / Unit)', () => {
  let resolver: ProductResolver;
  let productService: jest.Mocked<ProductService>;
  let imageService: jest.Mocked<ProductImageService>;
  let combinationService: jest.Mocked<ProductCombinationService>;
  let stockService: jest.Mocked<ProductStockService>;
  let duplicateService: jest.Mocked<ProductDuplicateService>;

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Laptop',
    slug: 'test-laptop',
    price: 999.99,
    combinations: [],
  };

  beforeEach(async () => {
    const mockProductSvc = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const mockImageSvc = {
      addImage: jest.fn(),
      removeImage: jest.fn(),
      setCoverImage: jest.fn(),
    };
    const mockComboSvc = {
      addCombination: jest.fn(),
      updateCombination: jest.fn(),
      deleteCombination: jest.fn(),
    };
    const mockStockSvc = {
      updateStock: jest.fn(),
      incrementStock: jest.fn(),
      decrementStock: jest.fn(),
      checkAvailability: jest.fn(),
    };
    const mockDupSvc = {
      duplicate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductResolver,
        { provide: ProductService, useValue: mockProductSvc },
        { provide: ProductImageService, useValue: mockImageSvc },
        { provide: ProductCombinationService, useValue: mockComboSvc },
        { provide: ProductStockService, useValue: mockStockSvc },
        { provide: ProductDuplicateService, useValue: mockDupSvc },
      ],
    })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<ProductResolver>(ProductResolver);
    productService = module.get(ProductService);
    imageService = module.get(ProductImageService);
    combinationService = module.get(ProductCombinationService);
    stockService = module.get(ProductStockService);
    duplicateService = module.get(ProductDuplicateService);
  });

  describe('products query', () => {
    it('should return paginated list of products with filters', async () => {
      productService.findAll.mockResolvedValue({
        items: [mockProduct as any],
        total: 1,
      });
      const result = await resolver.products({
        categoryId: 'cat-1',
        skip: 0,
        take: 10,
      });
      expect(productService.findAll).toHaveBeenCalledWith({
        categoryId: 'cat-1',
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({ items: [mockProduct], total: 1 });
    });
  });

  describe('product query', () => {
    it('should return single product by ID', async () => {
      productService.findById.mockResolvedValue(mockProduct as any);
      const result = await resolver.product('prod-1');
      expect(productService.findById).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('createProduct mutation', () => {
    it('should create product with auto-generated slug', async () => {
      const input = { name: 'New Phone', price: 500, categoryId: 'cat-1' };
      productService.create.mockResolvedValue({
        id: 'prod-2',
        ...input,
        slug: 'new-phone',
      } as any);

      const result = await resolver.createProduct(input as any);
      expect(productService.create).toHaveBeenCalledWith(input);
      expect(result).toHaveProperty('slug', 'new-phone');
    });
  });

  describe('image mutations', () => {
    it('should add, remove, and set cover image', async () => {
      imageService.addImage.mockResolvedValue({
        id: 'img-1',
        url: 'test.jpg',
      } as any);
      imageService.removeImage.mockResolvedValue({ id: 'img-1' } as any);
      imageService.setCoverImage.mockResolvedValue({
        id: 'img-1',
        isCover: true,
      } as any);

      await resolver.addProductImage('prod-1', { url: 'test.jpg' } as any);
      expect(imageService.addImage).toHaveBeenCalledWith('prod-1', {
        url: 'test.jpg',
      });

      await resolver.removeProductImage('img-1');
      expect(imageService.removeImage).toHaveBeenCalledWith('img-1');

      await resolver.setProductCoverImage('img-1');
      expect(imageService.setCoverImage).toHaveBeenCalledWith('img-1');
    });
  });

  describe('combination mutations', () => {
    it('should add, update, and delete product combinations', async () => {
      combinationService.addCombination.mockResolvedValue({
        id: 'combo-1',
      } as any);
      combinationService.updateCombination.mockResolvedValue({
        id: 'combo-1',
        priceImpact: 10,
      } as any);
      combinationService.deleteCombination.mockResolvedValue({
        id: 'combo-1',
      } as any);

      await resolver.addProductCombination('prod-1', { sku: 'SKU1' } as any);
      expect(combinationService.addCombination).toHaveBeenCalledWith('prod-1', {
        sku: 'SKU1',
      });

      await resolver.updateProductCombination('combo-1', {
        priceImpact: 10,
      } as any);
      expect(combinationService.updateCombination).toHaveBeenCalledWith(
        'combo-1',
        { priceImpact: 10 },
      );

      await resolver.deleteProductCombination('combo-1');
      expect(combinationService.deleteCombination).toHaveBeenCalledWith(
        'combo-1',
      );
    });
  });

  describe('stock mutations and queries', () => {
    it('should update, increment, decrement stock and check availability', async () => {
      stockService.updateStock.mockResolvedValue({
        id: 'stock-1',
        quantity: 50,
      } as any);
      stockService.incrementStock.mockResolvedValue({
        id: 'stock-1',
        quantity: 60,
      } as any);
      stockService.decrementStock.mockResolvedValue({
        id: 'stock-1',
        quantity: 40,
      } as any);
      stockService.checkAvailability.mockResolvedValue(true);

      await resolver.updateStock({ stockId: 'stock-1', quantity: 50 } as any);
      expect(stockService.updateStock).toHaveBeenCalledWith({
        stockId: 'stock-1',
        quantity: 50,
      });

      await resolver.incrementStock('stock-1', 10);
      expect(stockService.incrementStock).toHaveBeenCalledWith('stock-1', 10);

      await resolver.decrementStock('stock-1', 20);
      expect(stockService.decrementStock).toHaveBeenCalledWith('stock-1', 20);

      const isAvailable = await resolver.checkProductAvailability(
        'prod-1',
        undefined,
        5,
      );
      expect(stockService.checkAvailability).toHaveBeenCalledWith(
        'prod-1',
        undefined,
        5,
      );
      expect(isAvailable).toBe(true);
    });
  });

  describe('duplicateProduct mutation', () => {
    it('should duplicate product and all relations', async () => {
      duplicateService.duplicate.mockResolvedValue({
        id: 'prod-copy',
        name: 'Test Laptop (Copy)',
      } as any);

      const result = await resolver.duplicateProduct('prod-1');
      expect(duplicateService.duplicate).toHaveBeenCalledWith('prod-1');
      expect(result.name).toContain('Copy');
    });
  });
});
