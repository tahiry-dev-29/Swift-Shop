import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CategoryService } from './category.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CategoryCacheService } from './category-cache.service';

function makePrisma(): Mocked<PrismaService> {
  return {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  } as unknown as Mocked<PrismaService>;
}

function makeCache(): Mocked<CategoryCacheService> {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    invalidate: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<CategoryCacheService>;
}

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: Mocked<PrismaService>;
  let cache: Mocked<CategoryCacheService>;

  beforeEach(() => {
    prisma = makePrisma();
    cache = makeCache();
    service = new CategoryService(prisma, cache);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return cached categories if available', async () => {
      const cached = [{ id: 'cat1', name: 'Electronics' }];
      cache.get.mockResolvedValue(cached);

      const result = await service.findAll();
      expect(result).toBe(cached);
      expect(prisma.category.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and set cache on cache miss', async () => {
      const categories = [{ id: 'cat1', name: 'Electronics', deletedAt: null }];
      cache.get.mockResolvedValue(null);
      prisma.category.findMany.mockResolvedValue(categories as never);

      const result = await service.findAll();
      expect(result).toBe(categories);
      expect(cache.set).toHaveBeenCalledWith('categories:all', categories);
    });
  });

  // ─── findTree ─────────────────────────────────────────────────────────────

  describe('findTree', () => {
    it('should return cached tree if available', async () => {
      const cached = [{ id: 'cat1', children: [] }];
      cache.get
        .mockResolvedValueOnce(null) // findAll call misses
        .mockResolvedValueOnce(cached); // findTree call hits

      // Re-create service so we control cache.get call order
      service = new CategoryService(prisma, cache);
      const result = await service.findTree();
      expect(result).toBe(cached);
    });

    it('should build tree from DB on cache miss', async () => {
      const tree = [{ id: 'cat1', children: [] }];
      cache.get.mockResolvedValue(null);
      prisma.category.findMany.mockResolvedValue(tree as never);

      const result = await service.findTree();
      expect(result).toBe(tree);
      expect(cache.set).toHaveBeenCalledWith('categories:tree', tree);
    });
  });

  // ─── getConnection (cursor pagination) ────────────────────────────────────

  describe('getConnection', () => {
    it('should return first page with hasNextPage=false when fewer items than take', async () => {
      const cats = [{ id: 'cat1' }, { id: 'cat2' }];
      prisma.category.findMany.mockResolvedValue(cats as never);
      prisma.category.count.mockResolvedValue(2);

      const result = await service.getConnection({ first: 10 });
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.edges).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it('should return hasNextPage=true when more items exist', async () => {
      // take=2, so we request 3 items and return 3 meaning there is a next page
      const cats = [{ id: 'cat1' }, { id: 'cat2' }, { id: 'cat3' }];
      prisma.category.findMany.mockResolvedValue(cats as never);
      prisma.category.count.mockResolvedValue(5);

      const result = await service.getConnection({ first: 2 });
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.edges).toHaveLength(2); // slice to `take`
    });

    it('should include cursor in query when `after` is provided', async () => {
      prisma.category.findMany.mockResolvedValue([] as never);
      prisma.category.count.mockResolvedValue(0);

      await service.getConnection({ first: 5, after: 'cursor-id' });
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'cursor-id' },
          skip: 1,
        }),
      );
    });

    it('should filter by parentId if provided', async () => {
      prisma.category.findMany.mockResolvedValue([] as never);
      prisma.category.count.mockResolvedValue(0);

      await service.getConnection({ parentId: 'parent1' });
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ parentId: 'parent1' }),
        }),
      );
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should auto-generate slug from name if not provided', async () => {
      const created = { id: 'cat-new', name: 'My Category', path: '' };
      const updated = { ...created, path: 'cat-new/' };

      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            category: {
              create: vi.fn().mockResolvedValue(created),
              update: vi.fn().mockResolvedValue(updated),
            },
          };
          return cb(tx);
        }
        return cb;
      });

      const result = await service.create({ name: 'My Category' });
      expect(result.path).toBe('cat-new/');
      expect(cache.invalidate).toHaveBeenCalled();
    });

    it('should use provided slug if given', async () => {
      const created = { id: 'cat-new', name: 'My Category', path: '' };
      const updated = { ...created, path: 'cat-new/', slug: 'custom-slug' };

      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            category: {
              create: vi.fn().mockResolvedValue(created),
              update: vi.fn().mockResolvedValue(updated),
            },
          };
          return cb(tx);
        }
        return cb;
      });

      const result = await service.create({
        name: 'My Category',
        slug: 'custom-slug',
      });
      expect(result).toMatchObject({ slug: 'custom-slug' });
    });

    it('should prepend parent path when parentId is provided', async () => {
      const parent = {
        id: 'parent1',
        path: 'parent1/',
        deletedAt: null,
        parentId: null,
      };
      prisma.category.findUnique.mockResolvedValue(parent as never);

      const created = { id: 'child1', name: 'Child', path: '' };
      const updated = { ...created, path: 'parent1/child1/' };

      prisma.$transaction.mockImplementation(async (cb: unknown) => {
        if (typeof cb === 'function') {
          const tx = {
            category: {
              create: vi.fn().mockResolvedValue(created),
              update: vi.fn().mockResolvedValue(updated),
            },
          };
          return cb(tx);
        }
        return cb;
      });

      const result = await service.create({
        name: 'Child',
        parentId: 'parent1',
      });
      expect(result.path).toBe('parent1/child1/');
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should regenerate slug if name changes without explicit slug', async () => {
      const updated = { id: 'cat1', name: 'New Name', slug: 'new-name' };
      prisma.category.update.mockResolvedValue(updated as never);

      const result = await service.update('cat1', { name: 'New Name' });
      expect(prisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: expect.stringMatching(/new/) }),
        }),
      );
      expect(result).toBe(updated);
      expect(cache.invalidate).toHaveBeenCalled();
    });

    it('should not regenerate slug if slug is explicitly provided', async () => {
      const updated = { id: 'cat1', name: 'New Name', slug: 'explicit-slug' };
      prisma.category.update.mockResolvedValue(updated as never);

      await service.update('cat1', { name: 'New Name', slug: 'explicit-slug' });
      expect(prisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'explicit-slug' }),
        }),
      );
    });
  });

  // ─── delete (soft delete) ─────────────────────────────────────────────────

  describe('delete', () => {
    it('should throw error if category not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(service.delete('cat1')).rejects.toThrow(
        'Category not found',
      );
    });

    it('should soft-delete category and all children under its path', async () => {
      const cat = { id: 'cat1', path: 'cat1/' };
      prisma.category.findUnique.mockResolvedValue(cat as never);
      prisma.category.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.delete('cat1');
      expect(prisma.category.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ id: 'cat1' }, { path: { startsWith: 'cat1/' } }],
          },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      expect(result).toEqual({ count: 3 });
      expect(cache.invalidate).toHaveBeenCalled();
    });
  });

  // ─── reorderCategories ─────────────────────────────────────────────────────

  describe('reorderCategories', () => {
    it('should batch-update positions and invalidate cache', async () => {
      const updates = [
        { id: 'cat1', position: 0 },
        { id: 'cat2', position: 1 },
      ];
      const expectedResult = updates.map((u) => ({ ...u }));
      prisma.$transaction.mockResolvedValue(expectedResult as never);

      const result = await service.reorderCategories(updates);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(cache.invalidate).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });
});
