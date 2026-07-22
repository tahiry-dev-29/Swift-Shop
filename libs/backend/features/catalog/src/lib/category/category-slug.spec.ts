import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoryService } from './category.service';

describe('CategoryService Slug & Uniqueness', () => {
  let service: CategoryService;
  let prisma: any;
  let cache: any;

  beforeEach(() => {
    prisma = {
      category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    cache = {
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
    };
    service = new CategoryService(prisma, cache);
  });

  it('should auto-generate slug from category name with sanitized special characters', async () => {
    const created = {
      id: 'cat-1',
      name: 'Laptops & Computers!',
      slug: 'laptops-computers',
    };
    prisma.$transaction.mockImplementation(async (cb: any) =>
      cb({
        category: {
          create: vi.fn().mockResolvedValue(created),
          update: vi.fn().mockResolvedValue({ ...created, path: 'cat-1/' }),
        },
      }),
    );

    const res = await service.create({ name: 'Laptops & Computers!' });
    expect(res.slug).toBe('laptops-computers');
  });

  it('should preserve custom slug if manually provided', async () => {
    const created = {
      id: 'cat-2',
      name: 'Custom Category',
      slug: 'my-custom-slug',
    };
    prisma.$transaction.mockImplementation(async (cb: any) =>
      cb({
        category: {
          create: vi.fn().mockResolvedValue(created),
          update: vi.fn().mockResolvedValue({ ...created, path: 'cat-2/' }),
        },
      }),
    );

    const res = await service.create({
      name: 'Custom Category',
      slug: 'my-custom-slug',
    });
    expect(res.slug).toBe('my-custom-slug');
  });

  it('should update slug when category name changes without explicit slug', async () => {
    const updated = {
      id: 'cat-1',
      name: 'New Laptops Name',
      slug: 'new-laptops-name',
    };
    prisma.category.update.mockResolvedValue(updated);

    const res = await service.update('cat-1', { name: 'New Laptops Name' });
    expect(prisma.category.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: 'new-laptops-name' }),
      }),
    );
    expect(res.slug).toBe('new-laptops-name');
  });
});
