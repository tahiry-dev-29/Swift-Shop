import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
    this.client = new Redis(redisUrl);
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async setBlacklistToken(jti: string, expiresIn: number): Promise<void> {
    await this.client.set(`bl_${jti}`, '1', 'EX', expiresIn);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await this.client.get(`bl_${jti}`);
    return result === '1';
  }

  async storeRefreshToken(
    userId: string,
    jti: string,
    expiresIn: number,
  ): Promise<void> {
    await this.client.set(`rt_${userId}`, jti, 'EX', expiresIn);
  }

  async getStoredRefreshTokenJti(userId: string): Promise<string | null> {
    return this.client.get(`rt_${userId}`);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async setJson<T>(key: string, value: T, expiresIn: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', expiresIn);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    for await (const keys of stream) {
      if (Array.isArray(keys) && keys.length > 0) {
        await this.client.del(...keys);
      }
    }
  }

  async keysByPattern(pattern: string): Promise<string[]> {
    const foundKeys: string[] = [];
    const stream = this.client.scanStream({ match: pattern, count: 100 });
    for await (const keys of stream) {
      if (Array.isArray(keys) && keys.length > 0) {
        foundKeys.push(...keys);
      }
    }
    return foundKeys;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}
