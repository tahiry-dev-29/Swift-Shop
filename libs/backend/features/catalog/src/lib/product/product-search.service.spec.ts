import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { ProductSearchService } from './product-search.service';
import { SearchService } from '@swift-shop/backend/search';

function makeSearchService(): Mocked<SearchService> {
  return {
    setupIndex: vi.fn().mockResolvedValue(undefined),
    addDocuments: vi.fn().mockResolvedValue(undefined),
    deleteDocuments: vi.fn().mockResolvedValue(undefined),
    search: vi.fn(),
  } as unknown as Mocked<SearchService>;
}

describe('ProductSearchService', () => {
  let service: ProductSearchService;
  let searchService: Mocked<SearchService>;

  beforeEach(() => {
    searchService = makeSearchService();
    service = new ProductSearchService(searchService);
  });

  // ─── onModuleInit ────────────────────────────────────────────────────────

  describe('onModuleInit', () => {
    it('should set up the products index with correct searchable/filterable/sortable attributes', async () => {
      await service.onModuleInit();
      expect(searchService.setupIndex).toHaveBeenCalledWith('products', {
        searchableAttributes: ['name', 'reference', 'descriptionShort'],
        filterableAttributes: ['categoryId', 'active', 'price'],
        sortableAttributes: ['price', 'dateAdd'],
      });
    });
  });

  // ─── syncProduct ─────────────────────────────────────────────────────────

  describe('syncProduct', () => {
    it('should call addDocuments with normalized product document', async () => {
      const product = {
        id: 'p1',
        name: 'Widget',
        reference: 'REF-001',
        descriptionShort: 'A widget',
        price: 99,
        categoryId: 'cat1',
        active: true,
        dateAdd: new Date('2025-01-01'),
        someIrrelevantField: 'ignored',
      };

      await service.syncProduct(product);

      expect(searchService.addDocuments).toHaveBeenCalledWith(
        'products',
        [
          {
            id: 'p1',
            name: 'Widget',
            reference: 'REF-001',
            descriptionShort: 'A widget',
            price: 99,
            categoryId: 'cat1',
            active: true,
            dateAdd: product.dateAdd,
          },
        ],
        'id',
      );
    });

    it('should not throw when MeiliSearch fails (graceful degradation)', async () => {
      searchService.addDocuments.mockRejectedValue(
        new Error('MeiliSearch unavailable'),
      );

      await expect(
        service.syncProduct({ id: 'p1', name: 'Widget' }),
      ).resolves.not.toThrow();
    });
  });

  // ─── deleteProduct ────────────────────────────────────────────────────────

  describe('deleteProduct', () => {
    it('should call deleteDocuments with the product id', async () => {
      await service.deleteProduct('p1');
      expect(searchService.deleteDocuments).toHaveBeenCalledWith('products', [
        'p1',
      ]);
    });

    it('should not throw when MeiliSearch delete fails', async () => {
      searchService.deleteDocuments.mockRejectedValue(
        new Error('Index not found'),
      );

      await expect(service.deleteProduct('p1')).resolves.not.toThrow();
    });
  });

  // ─── search ───────────────────────────────────────────────────────────────

  describe('search', () => {
    it('should delegate to searchService.search with index and query', async () => {
      const hits = [{ id: 'p1', name: 'Widget' }];
      searchService.search.mockResolvedValue(hits as never);

      const result = await service.search('widget', { limit: 10 });
      expect(searchService.search).toHaveBeenCalledWith('products', 'widget', {
        limit: 10,
      });
      expect(result).toBe(hits);
    });
  });
});
