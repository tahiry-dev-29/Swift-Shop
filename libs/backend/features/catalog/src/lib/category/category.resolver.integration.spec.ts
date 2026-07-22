import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoryResolver } from './category.resolver';
import { CategoryService } from './category.service';
import { CatalogDataLoader } from '../catalog.dataloader';
import { SuperAdminGuard } from '@swift-shop/backend/auth';

describe('CategoryResolver (Integration / Unit)', () => {
  let resolver: CategoryResolver;
  let categoryService: jest.Mocked<CategoryService>;
  let dataLoader: jest.Mocked<CatalogDataLoader>;

  const mockCategory = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    path: 'cat-1',
    position: 0,
  };

  beforeEach(async () => {
    const mockCategorySvc = {
      findAll: jest.fn(),
      findTree: jest.fn(),
      getConnection: jest.fn(),
      findById: jest.fn(),
      getPath: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      reorderCategories: jest.fn(),
    };

    const mockDataLoader = {
      categoryChildrenLoader: {
        load: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryResolver,
        { provide: CategoryService, useValue: mockCategorySvc },
        { provide: CatalogDataLoader, useValue: mockDataLoader },
      ],
    })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<CategoryResolver>(CategoryResolver);
    categoryService = module.get(CategoryService);
    dataLoader = module.get(CatalogDataLoader);
  });

  describe('categories & categoryTree queries', () => {
    it('should return all categories and tree layout', async () => {
      categoryService.findAll.mockResolvedValue([mockCategory as any]);
      categoryService.findTree.mockResolvedValue([
        { ...mockCategory, children: [] } as any,
      ]);

      const categories = await resolver.categories();
      const tree = await resolver.categoryTree();

      expect(categoryService.findAll).toHaveBeenCalled();
      expect(categoryService.findTree).toHaveBeenCalled();
      expect(categories).toEqual([mockCategory]);
      expect(tree).toHaveLength(1);
    });

    it('should handle paginated category connection', async () => {
      const connResult = {
        edges: [],
        pageInfo: { hasNextPage: false, endCursor: null },
        totalCount: 0,
      };
      categoryService.getConnection.mockResolvedValue(connResult as any);

      const res = await resolver.categoryConnection({ first: 10 });
      expect(categoryService.getConnection).toHaveBeenCalledWith({ first: 10 });
      expect(res).toEqual(connResult);
    });

    it('should return category by ID or throw NotFoundException', async () => {
      categoryService.findById.mockResolvedValue(mockCategory as any);
      const cat = await resolver.category('cat-1');
      expect(cat).toEqual(mockCategory);

      categoryService.findById.mockResolvedValue(null);
      await expect(resolver.category('cat-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return category path array', async () => {
      categoryService.getPath.mockResolvedValue(['cat-1', 'cat-2']);
      const path = await resolver.categoryPath('cat-2');
      expect(path).toEqual(['cat-1', 'cat-2']);
    });
  });

  describe('createCategory & updateCategory mutations', () => {
    it('should create a new category', async () => {
      const input = { name: 'Smartphones', parentId: 'cat-1' };
      categoryService.create.mockResolvedValue({
        id: 'cat-2',
        ...input,
        slug: 'smartphones',
      } as any);

      const result = await resolver.createCategory(input as any);
      expect(categoryService.create).toHaveBeenCalledWith(input);
      expect(result.slug).toBe('smartphones');
    });

    it('should update existing category or throw NotFoundException', async () => {
      categoryService.findById.mockResolvedValue(mockCategory as any);
      categoryService.update.mockResolvedValue({
        ...mockCategory,
        name: 'Consumer Electronics',
      } as any);

      const res = await resolver.updateCategory('cat-1', {
        name: 'Consumer Electronics',
      } as any);
      expect(res.name).toBe('Consumer Electronics');

      categoryService.findById.mockResolvedValue(null);
      await expect(
        resolver.updateCategory('cat-unknown', { name: 'Test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCategory & reorderCategories mutations', () => {
    it('should delete category or wrap errors in BadRequestException', async () => {
      categoryService.findById.mockResolvedValue(mockCategory as any);
      categoryService.delete.mockResolvedValue(mockCategory as any);

      const del = await resolver.deleteCategory('cat-1');
      expect(del).toEqual(mockCategory);

      categoryService.delete.mockRejectedValue(
        new Error('Cannot delete category with active products'),
      );
      await expect(resolver.deleteCategory('cat-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reorder category positions', async () => {
      categoryService.reorderCategories.mockResolvedValue(undefined);
      const inputs = [
        { id: 'cat-1', position: 1 },
        { id: 'cat-2', position: 0 },
      ];

      const res = await resolver.reorderCategories(inputs);
      expect(categoryService.reorderCategories).toHaveBeenCalledWith(inputs);
      expect(res).toBe(true);
    });
  });

  describe('children field resolver', () => {
    it('should load children via dataloader', async () => {
      (dataLoader.categoryChildrenLoader.load as jest.Mock).mockResolvedValue([
        { id: 'cat-sub' },
      ]);
      const children = await resolver.children(mockCategory as any);
      expect(dataLoader.categoryChildrenLoader.load).toHaveBeenCalledWith(
        'cat-1',
      );
      expect(children).toEqual([{ id: 'cat-sub' }]);
    });
  });
});
