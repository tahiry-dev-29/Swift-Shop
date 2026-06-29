import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

const CATEGORY_CACHE_KEYS = ['categories:all', 'categories:tree'] as const;
const CATEGORY_CACHE_TTL_SECONDS = 3600;

@Injectable()
export class CategoryCacheService {
  private readonly redis = new Redis(
    process.env['REDIS_URL'] || 'redis://localhost:6379',
  );

  async get<T>(key: (typeof CATEGORY_CACHE_KEYS)[number]) {
    const cached = await this.redis.get(key);
    return cached ? (JSON.parse(cached) as T) : null;
  }

  async set(key: (typeof CATEGORY_CACHE_KEYS)[number], value: unknown) {
    await this.redis.set(
      key,
      JSON.stringify(value),
      'EX',
      CATEGORY_CACHE_TTL_SECONDS,
    );
  }

  async invalidate() {
    await this.redis.del(...CATEGORY_CACHE_KEYS);
  }
}
