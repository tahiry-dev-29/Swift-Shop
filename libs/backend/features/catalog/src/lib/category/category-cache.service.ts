import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

const CATEGORY_CACHE_KEYS = ['categories:all', 'categories:tree'] as const;
const CATEGORY_CACHE_TTL_SECONDS = 3600;

@Injectable()
export class CategoryCacheService {
  private readonly logger = new Logger(CategoryCacheService.name);
  private redis: Redis | null = null;

  private getClient(): Redis | null {
    if (!this.redis) {
      this.redis = new Redis(
        process.env['REDIS_URL'] || 'redis://localhost:6379',
        {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        },
      );
      this.redis.on('error', (err) =>
        this.logger.error('Redis category cache error', err),
      );
      this.redis.connect().catch(() => {
        this.logger.warn('Redis not available — category cache disabled');
      });
    }
    return this.redis;
  }

  async get<T>(key: (typeof CATEGORY_CACHE_KEYS)[number]) {
    const client = this.getClient();
    if (!client) return null;
    try {
      const cached = await client.get(key);
      return cached ? (JSON.parse(cached) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: (typeof CATEGORY_CACHE_KEYS)[number], value: unknown) {
    const client = this.getClient();
    if (!client) return;
    try {
      await client.set(
        key,
        JSON.stringify(value),
        'EX',
        CATEGORY_CACHE_TTL_SECONDS,
      );
    } catch {
      this.logger.warn('Failed to set category cache');
    }
  }

  async invalidate() {
    const client = this.getClient();
    if (!client) return;
    try {
      await client.del(...CATEGORY_CACHE_KEYS);
    } catch {
      this.logger.warn('Failed to invalidate category cache');
    }
  }
}
