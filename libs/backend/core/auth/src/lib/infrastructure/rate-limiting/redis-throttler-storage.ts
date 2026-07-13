import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { AUTH_RATE_LIMIT_REDIS_PREFIX } from './rate-limit.constants';

const DEFAULT_REDIS_URL = 'redis://localhost:6379';

type RateLimitStorageRecord = {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
};

function toSeconds(milliseconds: number): number {
  return Math.max(0, Math.ceil(milliseconds / 1000));
}

function toTtlSeconds(milliseconds: number): number {
  return toSeconds(milliseconds > 0 ? milliseconds : 0);
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(configService: ConfigService) {
    const redisUrl =
      configService.get<string>('REDIS_URL') ?? DEFAULT_REDIS_URL;

    this.redis = new Redis(redisUrl, {
      enableOfflineQueue: false,
      lazyConnect: false,
      maxRetriesPerRequest: 1,
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis Throttler error', err);
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<RateLimitStorageRecord> {
    const hitsKey = this.key(throttlerName, key, 'hits');
    const blockKey = this.key(throttlerName, key, 'blocked');
    const blockedTtl = await this.redis.pttl(blockKey);

    if (blockedTtl > 0) {
      const hitsTtl = await this.redis.pttl(hitsKey);

      return {
        totalHits: limit + 1,
        timeToExpire: toTtlSeconds(hitsTtl),
        isBlocked: true,
        timeToBlockExpire: toSeconds(blockedTtl),
      };
    }

    const totalHits = await this.redis.incr(hitsKey);

    if (totalHits === 1) {
      await this.redis.pexpire(hitsKey, ttl);
    }

    const hitsTtl = await this.redis.pttl(hitsKey);

    if (totalHits > limit) {
      await this.redis.set(blockKey, '1', 'PX', blockDuration);

      return {
        totalHits,
        timeToExpire: toTtlSeconds(hitsTtl),
        isBlocked: true,
        timeToBlockExpire: toSeconds(blockDuration),
      };
    }

    return {
      totalHits,
      timeToExpire: toTtlSeconds(hitsTtl),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  private key(throttlerName: string, key: string, suffix: string): string {
    return `${AUTH_RATE_LIMIT_REDIS_PREFIX}:${throttlerName}:${key}:${suffix}`;
  }
}
