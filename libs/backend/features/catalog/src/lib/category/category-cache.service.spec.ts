import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoryCacheService } from './category-cache.service';

// ─── Mock ioredis ───────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDel = vi.fn();
const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockOn = vi.fn().mockReturnThis();

vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    get: mockGet,
    set: mockSet,
    del: mockDel,
    connect: mockConnect,
    on: mockOn,
  })),
}));

describe('CategoryCacheService', () => {
  let service: CategoryCacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoryCacheService();
  });

  // ─── get ────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('should return parsed data on cache hit', async () => {
      const payload = [{ id: 'cat1', name: 'Electronics' }];
      mockGet.mockResolvedValue(JSON.stringify(payload));

      const result = await service.get('categories:all');
      expect(result).toEqual(payload);
    });

    it('should return null on cache miss (no value stored)', async () => {
      mockGet.mockResolvedValue(null);

      const result = await service.get('categories:all');
      expect(result).toBeNull();
    });

    it('should return null and not throw when Redis errors', async () => {
      mockGet.mockRejectedValue(new Error('Redis down'));

      const result = await service.get('categories:tree');
      expect(result).toBeNull();
    });
  });

  // ─── set ────────────────────────────────────────────────────────────────

  describe('set', () => {
    it('should serialize and store value with TTL', async () => {
      const data = [{ id: 'cat1' }];
      mockSet.mockResolvedValue('OK');

      await service.set('categories:all', data);
      expect(mockSet).toHaveBeenCalledWith(
        'categories:all',
        JSON.stringify(data),
        'EX',
        3600,
      );
    });

    it('should silently ignore Redis errors on set', async () => {
      mockSet.mockRejectedValue(new Error('Redis write failure'));
      await expect(service.set('categories:all', [])).resolves.not.toThrow();
    });
  });

  // ─── invalidate ─────────────────────────────────────────────────────────

  describe('invalidate', () => {
    it('should delete all known category cache keys', async () => {
      mockDel.mockResolvedValue(2);

      await service.invalidate();
      expect(mockDel).toHaveBeenCalledWith('categories:all', 'categories:tree');
    });

    it('should silently ignore Redis errors on invalidate', async () => {
      mockDel.mockRejectedValue(new Error('Redis del failure'));
      await expect(service.invalidate()).resolves.not.toThrow();
    });
  });
});
