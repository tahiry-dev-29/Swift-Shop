import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { FeatureService } from './feature.service';
import { PrismaService } from '@swift-shop/data-access-prisma';

// ─── Mock ioredis ────────────────────────────────────────────────────────────
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
const mockRedisDel = vi.fn();
const mockRedisConnect = vi.fn().mockResolvedValue(undefined);
const mockRedisOn = vi.fn().mockReturnThis();

vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
    connect: mockRedisConnect,
    on: mockRedisOn,
  })),
}));

function makePrisma(): Mocked<PrismaService> {
  return {
    feature: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    featureValue: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as Mocked<PrismaService>;
}

describe('FeatureService', () => {
  let service: FeatureService;
  let prisma: Mocked<PrismaService>;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makePrisma();
    service = new FeatureService(prisma);
  });

  // ─── findAllFeatures ──────────────────────────────────────────────────────

  describe('findAllFeatures', () => {
    it('should return cached features on cache hit', async () => {
      const cached = [{ id: 'f1', name: 'Color' }];
      mockRedisGet.mockResolvedValue(JSON.stringify(cached));

      const result = await service.findAllFeatures();
      expect(result).toEqual(cached);
      expect(prisma.feature.findMany).not.toHaveBeenCalled();
    });

    it('should query DB and cache result on cache miss', async () => {
      const features = [{ id: 'f1', name: 'Color', values: [] }];
      mockRedisGet.mockResolvedValue(null);
      prisma.feature.findMany.mockResolvedValue(features as never);
      mockRedisSet.mockResolvedValue('OK');

      const result = await service.findAllFeatures();
      expect(result).toBe(features);
      expect(mockRedisSet).toHaveBeenCalledWith(
        'features:all',
        JSON.stringify(features),
        'EX',
        3600,
      );
    });

    it('should fall through to DB when Redis returns error on get', async () => {
      const features = [{ id: 'f1', name: 'Size', values: [] }];
      mockRedisGet.mockRejectedValue(new Error('Redis error'));
      prisma.feature.findMany.mockResolvedValue(features as never);

      const result = await service.findAllFeatures();
      expect(result).toBe(features);
    });
  });

  // ─── createFeature ────────────────────────────────────────────────────────

  describe('createFeature', () => {
    it('should create feature and invalidate cache', async () => {
      const created = { id: 'f1', name: 'Material' } as never;
      prisma.feature.create.mockResolvedValue(created);
      mockRedisDel.mockResolvedValue(1);

      const result = await service.createFeature({
        name: 'Material',
        position: 0,
      });
      expect(result).toBe(created);
      expect(mockRedisDel).toHaveBeenCalledWith('features:all');
    });
  });

  // ─── updateFeature ────────────────────────────────────────────────────────

  describe('updateFeature', () => {
    it('should update feature and invalidate cache', async () => {
      const updated = { id: 'f1', name: 'Updated' } as never;
      prisma.feature.update.mockResolvedValue(updated);
      mockRedisDel.mockResolvedValue(1);

      const result = await service.updateFeature('f1', { name: 'Updated' });
      expect(result).toBe(updated);
      expect(mockRedisDel).toHaveBeenCalledWith('features:all');
    });
  });

  // ─── deleteFeature ────────────────────────────────────────────────────────

  describe('deleteFeature', () => {
    it('should delete feature and invalidate cache', async () => {
      const deleted = { id: 'f1' } as never;
      prisma.feature.delete.mockResolvedValue(deleted);
      mockRedisDel.mockResolvedValue(1);

      const result = await service.deleteFeature('f1');
      expect(result).toBe(deleted);
      expect(mockRedisDel).toHaveBeenCalledWith('features:all');
    });
  });

  // ─── Feature Values CRUD ──────────────────────────────────────────────────

  describe('createValue', () => {
    it('should create a feature value linked to featureId and invalidate cache', async () => {
      const created = { id: 'fv1', featureId: 'f1', value: 'Red' } as never;
      prisma.featureValue.create.mockResolvedValue(created);
      mockRedisDel.mockResolvedValue(1);

      const result = await service.createValue('f1', {
        value: 'Red',
        position: 0,
      });
      expect(prisma.featureValue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ featureId: 'f1', value: 'Red' }),
        }),
      );
      expect(result).toBe(created);
      expect(mockRedisDel).toHaveBeenCalledWith('features:all');
    });
  });

  describe('updateValue', () => {
    it('should update feature value and invalidate cache', async () => {
      const updated = { id: 'fv1', value: 'Blue' } as never;
      prisma.featureValue.update.mockResolvedValue(updated);

      const result = await service.updateValue('fv1', { value: 'Blue' });
      expect(result).toBe(updated);
      expect(mockRedisDel).toHaveBeenCalled();
    });
  });

  describe('deleteValue', () => {
    it('should delete feature value and invalidate cache', async () => {
      const deleted = { id: 'fv1' } as never;
      prisma.featureValue.delete.mockResolvedValue(deleted);

      const result = await service.deleteValue('fv1');
      expect(result).toBe(deleted);
      expect(mockRedisDel).toHaveBeenCalled();
    });
  });
});
