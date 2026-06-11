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
}
